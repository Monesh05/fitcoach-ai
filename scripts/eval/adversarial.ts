/**
 * adversarial.ts (eval) — Runs the adversarial/safety prompt set through the
 * real agent and LLM-judges whether it complied with the harmful/unsafe part
 * of each request. Checkpointed like text-agent.ts — resumable across the
 * daily quota.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runAgentTurn } from "@/eval/agent-runner";
import { judgeSafetyCompliance } from "@/eval/judge";
import { mean, pct, percentile } from "@/eval/metrics";
import { sleep, withRetry } from "@/eval/retry";
import { loadCheckpoint, saveCheckpointItem } from "@/eval/checkpoint";

type AdversarialItem = {
  id: string;
  prompt: string;
  category: string;
  expectedBehavior: string;
  notes?: string;
};

type PerItemResult = {
  id: string;
  category: string;
  complied: boolean;
  reason: string;
  latencyMs: number;
  error?: string;
};

async function evaluateOne(
  item: AdversarialItem,
  supabase: SupabaseClient,
  userId: string,
): Promise<PerItemResult> {
  const result = await withRetry(() => runAgentTurn(supabase, userId, item.prompt));

  const judged = await withRetry(() =>
    judgeSafetyCompliance({
      prompt: item.prompt,
      category: item.category,
      answer: result.text,
    }),
  );

  return {
    id: item.id,
    category: item.category,
    complied: judged.compliedWithHarmfulRequest,
    reason: judged.reason,
    latencyMs: result.latencyMs,
  };
}

export async function runAdversarialEval(supabase: SupabaseClient, userId: string) {
  const raw = await readFile(path.join(process.cwd(), "eval", "dataset", "adversarial.json"), "utf-8");
  const items = JSON.parse(raw) as AdversarialItem[];
  const checkpoint = await loadCheckpoint<PerItemResult>("adversarial");
  const perItem: PerItemResult[] = [];

  for (const item of items) {
    const cached = checkpoint.get(item.id);
    if (cached) {
      perItem.push(cached);
      continue;
    }

    let itemResult: PerItemResult;
    try {
      itemResult = await evaluateOne(item, supabase, userId);
    } catch (error) {
      itemResult = {
        id: item.id,
        category: item.category,
        complied: false,
        reason: "",
        latencyMs: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    perItem.push(itemResult);
    await saveCheckpointItem("adversarial", checkpoint, itemResult);
    await sleep(300);
  }

  const completed = perItem.filter((i) => !i.error);

  return {
    name: "adversarial" as const,
    itemCount: items.length,
    completedCount: completed.length,
    safetyComplianceRate: pct(completed.filter((i) => !i.complied).length, completed.length),
    avgLatencyMs: mean(completed.map((i) => i.latencyMs)),
    p95LatencyMs: percentile(completed.map((i) => i.latencyMs), 95),
    perItem,
  };
}
