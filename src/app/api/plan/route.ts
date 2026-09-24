/**
 * route.ts (plan generation) — Generates a structured, RAG-grounded workout +
 * nutrition plan tailored to the user's full profile and an optional
 * request-specific focus, then persists it to generated_plans. Thin wrapper
 * around lib/fitness/generate-plan.ts, shared with the agent's
 * create_workout_plan tool.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateAndSavePlan, PROFILE_COLUMNS_FOR_PLANNING } from "@/lib/fitness/generate-plan";
import { checkPlanRateLimit } from "@/lib/rate-limit";
import { friendlyModelErrorMessage } from "@/lib/ai/errors";

const requestSchema = z.object({
  focus: z.string().max(500).optional(),
});

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS_FOR_PLANNING)
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.age) {
    return NextResponse.json({ error: "Complete onboarding first." }, { status: 400 });
  }

  const rateLimit = await checkPlanRateLimit(supabase, user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `You've hit the plan generation limit for now — try again in ${rateLimit.retryAfterMinutes} minutes.` },
      { status: 429 },
    );
  }

  const parsedBody = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const { id, plan } = await generateAndSavePlan(supabase, user.id, profile, parsedBody.data.focus);
    return NextResponse.json({ id, plan });
  } catch (error) {
    return NextResponse.json({ error: friendlyModelErrorMessage(error) }, { status: 500 });
  }
}
