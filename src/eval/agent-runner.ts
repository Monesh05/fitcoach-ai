/**
 * agent-runner.ts — Runs a single user turn through the same agent building
 * blocks used by app/api/chat/route.ts (tools, system prompt), via
 * generateText instead of streamText since evals don't need streaming.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { generateText, stepCountIs, type ModelMessage } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getTextModel, getVisionModel } from "@/lib/ai/openrouter";
import { buildAgentSystemPrompt, buildSystemPrompt, IMAGE_ANALYSIS_HINT } from "@/lib/ai/prompts";
import { createFitnessTools } from "@/lib/ai/tools";
import { formatChunksAsContext, retrieveRelevantChunks } from "@/lib/rag/retrieve";
import { checkGuardrails } from "@/lib/ai/guardrails";

function guardrailPrefixFor(userText: string): string {
  const guardrail = checkGuardrails(userText);
  return guardrail.extraSystemInstruction ? `${guardrail.extraSystemInstruction}\n\n` : "";
}

const MAX_AGENT_STEPS = 6;

export type AgentTurnResult = {
  text: string;
  toolCalls: { name: string; input: unknown; output: unknown }[];
  retrievedTitles: string[];
  retrievedContext: string;
  latencyMs: number;
  totalTokens: number;
};

function extractRetrievedContext(
  toolCalls: { name: string; input: unknown; output: unknown }[],
): { titles: string[]; context: string } {
  const searchCalls = toolCalls.filter((c) =>
    ["search_fitness_knowledge", "search_exercises", "search_foods"].includes(c.name),
  );
  const results = searchCalls.flatMap((c) => {
    const output = c.output as { results?: { title?: string; content?: string }[] } | undefined;
    return output?.results ?? [];
  });

  return {
    titles: results.map((r) => String(r.title ?? "")),
    context: results.map((r) => `[${r.title}]\n${r.content}`).join("\n\n"),
  };
}

export async function runAgentTurn(
  supabase: SupabaseClient,
  userId: string,
  userText: string,
): Promise<AgentTurnResult> {
  const tools = createFitnessTools(supabase, userId);
  const messages: ModelMessage[] = [{ role: "user", content: userText }];

  const start = Date.now();
  const result = await generateText({
    model: getTextModel(),
    system: `${guardrailPrefixFor(userText)}${buildAgentSystemPrompt()}`,
    messages,
    tools,
    stopWhen: stepCountIs(MAX_AGENT_STEPS),
  });
  const latencyMs = Date.now() - start;

  const toolCalls = result.toolCalls.map((call) => {
    const matchingResult = result.toolResults.find((r) => r.toolCallId === call.toolCallId);
    return { name: call.toolName, input: call.input, output: matchingResult?.output };
  });
  const { titles: retrievedTitles, context: retrievedContext } = extractRetrievedContext(toolCalls);

  return {
    text: result.text,
    toolCalls,
    retrievedTitles,
    retrievedContext,
    latencyMs,
    totalTokens: result.usage.totalTokens ?? 0,
  };
}

/**
 * Multimodal variant, mirroring the production path in app/api/chat/route.ts:
 * describe the image, use that description (+ any caption) to drive eager
 * retrieval, then answer with the image + retrieved context + tools all
 * available.
 */
export async function runMultimodalAgentTurn(
  supabase: SupabaseClient,
  userId: string,
  userText: string,
  imageDataUrl: string,
  imageDescription: string,
): Promise<AgentTurnResult & { imageDescription: string }> {
  const tools = createFitnessTools(supabase, userId);
  const retrievalQuery =
    [imageDescription, userText].filter(Boolean).join(". ") ||
    "general fitness and nutrition guidance";

  const chunks = await retrieveRelevantChunks(supabase, retrievalQuery);
  const context = formatChunksAsContext(chunks);
  const retrievedTitles = chunks.map((c) => String(c.metadata.title ?? ""));

  const systemPrompt = `${guardrailPrefixFor(userText)}${buildSystemPrompt(context)}\n\n${IMAGE_ANALYSIS_HINT}\n\nAutomated first-pass image description: ${imageDescription}\n\nYou also have tools available (logging a meal/workout, updating goals, generating a plan, looking up history) — use them if the user's message calls for one of those actions.`;

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: [
        { type: "image", image: imageDataUrl },
        { type: "text", text: userText || "What do you see in this image?" },
      ],
    },
  ];

  const start = Date.now();
  const result = await generateText({
    model: getVisionModel(),
    system: systemPrompt,
    messages,
    tools,
    stopWhen: stepCountIs(MAX_AGENT_STEPS),
  });
  const latencyMs = Date.now() - start;

  const toolCalls = result.toolCalls.map((call) => {
    const matchingResult = result.toolResults.find((r) => r.toolCallId === call.toolCallId);
    return { name: call.toolName, input: call.input, output: matchingResult?.output };
  });

  return {
    text: result.text,
    toolCalls,
    retrievedTitles,
    retrievedContext: context,
    latencyMs,
    totalTokens: result.usage.totalTokens ?? 0,
    imageDescription,
  };
}
