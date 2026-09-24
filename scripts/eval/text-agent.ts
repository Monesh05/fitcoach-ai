/**
 * text-agent.ts (eval) — Runs the fitness/nutrition question sets through the
 * real agent (tools + system prompt) and measures tool-call accuracy,
 * citation accuracy, faithfulness (LLM-judged), latency, and token usage.
 * Checkpointed: a re-run skips items that already succeeded (see
 * eval/checkpoint.ts), so it survives the free-tier daily quota across
 * multiple runs.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runAgentTurn } from "@/eval/agent-runner";
import { judgeFaithfulness } from "@/eval/judge";
import { mean, pct, percentile, textCitesTitle } from "@/eval/metrics";
import { sleep, withRetry } from "@/eval/retry";
import { loadCheckpoint, saveCheckpointItem } from "@/eval/checkpoint";

type QuestionItem = {
  id: string;
  question: string;
  expectedSourceTitles: string[];
  expectedToolCalls: string[];
  notes?: string;
};

type PerItemResult = {
  id: string;
  question: string;
  toolCallsMade: string[];
  toolCallMatch: boolean;
  citationMatch: boolean | null;
  faithful: boolean | null;
  latencyMs: number;
  totalTokens: number;
  error?: string;
};

export type TextAgentEvalResult = {
  name: string;
  itemCount: number;
  completedCount: number;
  toolCallAccuracy: number;
  citationAccuracy: number;
  faithfulness: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  avgTokens: number;
  perItem: PerItemResult[];
};

async function loadDataset(file: string): Promise<QuestionItem[]> {
  const raw = await readFile(path.join(process.cwd(), "eval", "dataset", file), "utf-8");
  return JSON.parse(raw) as QuestionItem[];
}

async function evaluateOne(item: QuestionItem, supabase: SupabaseClient, userId: string): Promise<PerItemResult> {
  const result = await withRetry(() => runAgentTurn(supabase, userId, item.question));

  const toolCallsMade = result.toolCalls.map((c) => c.name);
  const toolCallMatch = item.expectedToolCalls.every((expected) => toolCallsMade.includes(expected));

  let citationMatch: boolean | null = null;
  if (item.expectedSourceTitles.length > 0) {
    citationMatch = item.expectedSourceTitles.some((title) => textCitesTitle(result.text, title));
  }

  let faithful: boolean | null = null;
  if (result.retrievedContext) {
    const judged = await withRetry(() =>
      judgeFaithfulness({
        question: item.question,
        referenceMaterial: result.retrievedContext,
        answer: result.text,
      }),
    );
    faithful = judged.faithful;
  }

  return {
    id: item.id,
    question: item.question,
    toolCallsMade,
    toolCallMatch,
    citationMatch,
    faithful,
    latencyMs: result.latencyMs,
    totalTokens: result.totalTokens,
  };
}

export async function runTextAgentEval(
  supabase: SupabaseClient,
  userId: string,
  datasetFile: string,
  evalName: string,
): Promise<TextAgentEvalResult> {
  const items = await loadDataset(datasetFile);
  const checkpoint = await loadCheckpoint<PerItemResult>(evalName);
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
        question: item.question,
        toolCallsMade: [],
        toolCallMatch: false,
        citationMatch: null,
        faithful: null,
        latencyMs: 0,
        totalTokens: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    perItem.push(itemResult);
    await saveCheckpointItem(evalName, checkpoint, itemResult);
    await sleep(300);
  }

  const completed = perItem.filter((i) => !i.error);
  const citationChecks = completed.filter((i) => i.citationMatch !== null);
  const faithfulChecks = completed.filter((i) => i.faithful !== null);

  return {
    name: evalName,
    itemCount: items.length,
    completedCount: completed.length,
    toolCallAccuracy: pct(completed.filter((i) => i.toolCallMatch).length, completed.length),
    citationAccuracy: pct(citationChecks.filter((i) => i.citationMatch).length, citationChecks.length),
    faithfulness: pct(faithfulChecks.filter((i) => i.faithful).length, faithfulChecks.length),
    avgLatencyMs: mean(completed.map((i) => i.latencyMs)),
    p95LatencyMs: percentile(completed.map((i) => i.latencyMs), 95),
    avgTokens: mean(completed.map((i) => i.totalTokens)),
    perItem,
  };
}
