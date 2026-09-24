/**
 * plan-validity.ts (eval) — Measures structured-output (JSON) validity and
 * latency for plan generation across several varied requests against the
 * same profile, using the real generatePlan() used by both /api/plan and the
 * agent's create_workout_plan tool. Checkpointed like text-agent.ts —
 * resumable across the daily quota.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generatePlan,
  PROFILE_COLUMNS_FOR_PLANNING,
  type ProfileForPlanning,
} from "@/lib/fitness/generate-plan";
import { planSchema } from "@/lib/types/plan";
import { mean, pct, percentile } from "@/eval/metrics";
import { sleep, withRetry } from "@/eval/retry";
import { loadCheckpoint, saveCheckpointItem } from "@/eval/checkpoint";

const FOCUS_VARIATIONS = [
  "default",
  "Focus on upper body, limited gym time this week",
  "I want more cardio days mixed in",
  "Prioritize lower body and glutes",
  "Keep it to 3 days a week only",
  "Focus on core strength and stability",
  "I have a shoulder that gets cranky with overhead pressing",
  "Emphasize progressive overload on the big compound lifts",
  "I want a deload-style lighter week",
  "Focus on posterior chain development",
];

type PerItemResult = { id: string; focus: string; valid: boolean; latencyMs: number; error?: string };

export async function runPlanValidityEval(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS_FOR_PLANNING)
    .eq("id", userId)
    .maybeSingle();

  if (!(profile as ProfileForPlanning | null)?.age) {
    throw new Error("Eval user has not completed onboarding; cannot run plan-validity eval.");
  }

  const checkpoint = await loadCheckpoint<PerItemResult>("plan-validity");
  const perItem: PerItemResult[] = [];

  for (const focus of FOCUS_VARIATIONS) {
    const cached = checkpoint.get(focus);
    if (cached) {
      perItem.push(cached);
      continue;
    }

    const start = Date.now();
    let itemResult: PerItemResult;
    try {
      const plan = await withRetry(() =>
        generatePlan(supabase, profile as ProfileForPlanning, focus === "default" ? undefined : focus),
      );
      const latencyMs = Date.now() - start;
      const parsed = planSchema.safeParse(plan);
      itemResult = { id: focus, focus, valid: parsed.success, latencyMs };
    } catch (error) {
      itemResult = {
        id: focus,
        focus,
        valid: false,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    perItem.push(itemResult);
    await saveCheckpointItem("plan-validity", checkpoint, itemResult);
    await sleep(300);
  }

  const completed = perItem.filter((i) => !i.error);

  return {
    name: "plan-json-validity" as const,
    itemCount: FOCUS_VARIATIONS.length,
    completedCount: completed.length,
    validityRate: pct(completed.filter((i) => i.valid).length, completed.length),
    avgLatencyMs: mean(completed.map((i) => i.latencyMs)),
    p95LatencyMs: percentile(completed.map((i) => i.latencyMs), 95),
    perItem,
  };
}
