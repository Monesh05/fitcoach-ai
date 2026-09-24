/**
 * route.ts — Agentic chat endpoint. For text messages, the model reasons
 * step-by-step using tools (lib/ai/tools.ts) to pull the user's real profile,
 * weight/workout history, and knowledge-base search rather than a single
 * eagerly-built prompt. For an attached image, a vision model first describes
 * it, that description drives retrieval (multimodal RAG), and the final
 * vision-model answer — which also has the same tools available — sees the
 * image, the retrieved context, and the profile together. Persists both
 * sides of the exchange to the caller's chat session. Requires an
 * authenticated Supabase session.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { convertToModelMessages, isTextUIPart, stepCountIs, streamText, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTextModel, getVisionModel } from "@/lib/ai/openrouter";
import {
  buildAgentSystemPrompt,
  buildProfileSummary,
  buildSystemPrompt,
  IMAGE_ANALYSIS_HINT,
} from "@/lib/ai/prompts";
import { formatChunksAsContext, retrieveRelevantChunks } from "@/lib/rag/retrieve";
import { deriveSessionTitle } from "@/lib/chat/messages";
import { describeImageForRetrieval, isImageFilePart } from "@/lib/ai/image-analysis";
import { createFitnessTools } from "@/lib/ai/tools";
import { checkChatRateLimit } from "@/lib/rate-limit";
import { checkGuardrails } from "@/lib/ai/guardrails";
import { friendlyModelErrorMessage } from "@/lib/ai/errors";

const requestSchema = z.object({
  messages: z.array(z.unknown()).min(1),
  sessionId: z.string().uuid(),
});

const MAX_AGENT_STEPS = 6;

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkChatRateLimit(supabase, user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `You've hit the message limit for now — try again in ${rateLimit.retryAfterMinutes} minutes.` },
      { status: 429 },
    );
  }

  const parsedBody = requestSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sessionId } = parsedBody.data;
  const messages = parsedBody.data.messages as unknown as UIMessage[];
  const lastMessage = messages[messages.length - 1];

  const lastMessageText = lastMessage.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join(" ")
    .trim();

  const imagePart = lastMessage.parts.find(isImageFilePart);

  const { count: existingMessageCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  const { error: insertUserMessageError } = await supabase.from("messages").insert({
    session_id: sessionId,
    role: "user",
    content: lastMessageText,
    image_url: imagePart?.url ?? null,
  });

  if (insertUserMessageError) {
    return NextResponse.json(
      { error: `Failed to save message: ${insertUserMessageError.message}` },
      { status: 500 },
    );
  }

  if (!existingMessageCount) {
    await supabase
      .from("chat_sessions")
      .update({ title: deriveSessionTitle(lastMessageText) })
      .eq("id", sessionId);
  }

  const tools = createFitnessTools(supabase, user.id);
  const guardrail = checkGuardrails(lastMessageText);
  const guardrailPrefix = guardrail.extraSystemInstruction ? `${guardrail.extraSystemInstruction}\n\n` : "";

  let systemPrompt: string;
  let model = getTextModel();

  if (imagePart) {
    // Multimodal RAG: describe the image first so retrieval reflects what's
    // actually shown, not just any accompanying caption.
    const imageDescription = await describeImageForRetrieval(imagePart);
    const retrievalQuery =
      [imageDescription, lastMessageText].filter(Boolean).join(". ") ||
      "general fitness and nutrition guidance";

    const [contextResult, profileResult] = await Promise.allSettled([
      retrieveRelevantChunks(supabase, retrievalQuery),
      supabase
        .from("profiles")
        .select(
          "age, sex, height_cm, weight_kg, goal, activity_level, experience_level, equipment, dietary_preferences, allergies, cuisine_preference, calorie_target, protein_target_g, fitness_goals",
        )
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    const context =
      contextResult.status === "fulfilled" ? formatChunksAsContext(contextResult.value) : "";
    if (contextResult.status === "rejected") {
      console.error("RAG retrieval failed, continuing without context:", contextResult.reason);
    }

    const profile = profileResult.status === "fulfilled" ? profileResult.value.data : null;
    const profileSummary = profile ? buildProfileSummary(profile) : undefined;

    systemPrompt = `${guardrailPrefix}${buildSystemPrompt(context, profileSummary)}\n\n${IMAGE_ANALYSIS_HINT}${
      imageDescription
        ? `\n\nAutomated first-pass image description (used to retrieve the reference material above; verify/refine it against what you actually see): ${imageDescription}`
        : ""
    }\n\nYou also have tools available (logging a meal/workout, updating goals, generating a plan, looking up history) — use them if the user's message calls for one of those actions.`;
    model = getVisionModel();
  } else {
    // Agentic path: no pre-fetched context — the model calls tools as needed.
    systemPrompt = `${guardrailPrefix}${buildAgentSystemPrompt()}`;
  }

  const result = streamText({
    model,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(MAX_AGENT_STEPS),
  });

  return result.toUIMessageStreamResponse({
    onError: friendlyModelErrorMessage,
    onFinish: async ({ responseMessage }) => {
      const assistantText = responseMessage.parts
        .filter(isTextUIPart)
        .map((part) => part.text)
        .join(" ")
        .trim();

      if (!assistantText) return;

      const { error } = await supabase.from("messages").insert({
        session_id: sessionId,
        role: "assistant",
        content: assistantText,
      });

      if (error) {
        console.error("Failed to save assistant message:", error.message);
      }
    },
  });
}
