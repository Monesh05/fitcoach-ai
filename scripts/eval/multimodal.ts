/**
 * multimodal.ts (eval) — Runs the multimodal question set (real reference
 * images) through the production multimodal RAG pipeline: image description
 * -> retrieval -> grounded vision answer. Measures retrieval hit rate,
 * citation accuracy, tool-call accuracy, faithfulness, latency, and tokens.
 * Checkpointed like text-agent.ts — resumable across the daily quota.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { describeImageForRetrieval } from "@/lib/ai/image-analysis";
import { runMultimodalAgentTurn } from "@/eval/agent-runner";
import { judgeFaithfulness } from "@/eval/judge";
import { containsTitle, mean, pct, percentile, textCitesTitle } from "@/eval/metrics";
import { sleep, withRetry } from "@/eval/retry";
import { loadCheckpoint, saveCheckpointItem } from "@/eval/checkpoint";

type MultimodalItem = {
  id: string;
  image: string;
  question: string;
  expectedImageContent?: string;
  expectedSourceTitles?: string[];
  expectedToolCalls?: string[];
  notes?: string;
};

type PerItemResult = {
  id: string;
  imageDescription: string;
  retrievalHit: boolean | null;
  citationMatch: boolean | null;
  toolCallMatch: boolean | null;
  faithful: boolean | null;
  latencyMs: number;
  totalTokens: number;
  error?: string;
};

const IMAGE_DIR = path.join(process.cwd(), "eval", "fixtures", "images");

async function imageToDataUrl(fileName: string): Promise<string> {
  const buffer = await readFile(path.join(IMAGE_DIR, fileName));
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

async function evaluateOne(
  item: MultimodalItem,
  supabase: SupabaseClient,
  userId: string,
): Promise<PerItemResult> {
  const dataUrl = await imageToDataUrl(item.image);
  const imagePart = { type: "file" as const, mediaType: "image/jpeg", url: dataUrl };
  const imageDescription = await withRetry(() => describeImageForRetrieval(imagePart));

  const result = await withRetry(() =>
    runMultimodalAgentTurn(supabase, userId, item.question, dataUrl, imageDescription),
  );

  let retrievalHit: boolean | null = null;
  if (item.expectedSourceTitles?.length) {
    retrievalHit = item.expectedSourceTitles.some((t) => containsTitle(result.retrievedTitles, t));
  }

  let citationMatch: boolean | null = null;
  if (item.expectedSourceTitles?.length) {
    citationMatch = item.expectedSourceTitles.some((t) => textCitesTitle(result.text, t));
  }

  let toolCallMatch: boolean | null = null;
  if (item.expectedToolCalls?.length) {
    const madeNames = result.toolCalls.map((c) => c.name);
    toolCallMatch = item.expectedToolCalls.every((expected) => madeNames.includes(expected));
  }

  let faithful: boolean | null = null;
  if (result.retrievedContext) {
    const judged = await withRetry(() =>
      judgeFaithfulness({
        question: item.question || "(no caption — image only)",
        referenceMaterial: result.retrievedContext,
        answer: result.text,
      }),
    );
    faithful = judged.faithful;
  }

  return {
    id: item.id,
    imageDescription,
    retrievalHit,
    citationMatch,
    toolCallMatch,
    faithful,
    latencyMs: result.latencyMs,
    totalTokens: result.totalTokens,
  };
}

export async function runMultimodalEval(supabase: SupabaseClient, userId: string) {
  const raw = await readFile(path.join(process.cwd(), "eval", "dataset", "multimodal.json"), "utf-8");
  const items = JSON.parse(raw) as MultimodalItem[];
  const checkpoint = await loadCheckpoint<PerItemResult>("multimodal");
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
        imageDescription: "",
        retrievalHit: null,
        citationMatch: null,
        toolCallMatch: null,
        faithful: null,
        latencyMs: 0,
        totalTokens: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    perItem.push(itemResult);
    await saveCheckpointItem("multimodal", checkpoint, itemResult);
    await sleep(300);
  }

  const completed = perItem.filter((i) => !i.error);
  const retrievalChecks = completed.filter((i) => i.retrievalHit !== null);
  const citationChecks = completed.filter((i) => i.citationMatch !== null);
  const toolChecks = completed.filter((i) => i.toolCallMatch !== null);
  const faithfulChecks = completed.filter((i) => i.faithful !== null);

  return {
    name: "multimodal" as const,
    itemCount: items.length,
    completedCount: completed.length,
    retrievalHitRate: pct(retrievalChecks.filter((i) => i.retrievalHit).length, retrievalChecks.length),
    citationAccuracy: pct(citationChecks.filter((i) => i.citationMatch).length, citationChecks.length),
    toolCallAccuracy: pct(toolChecks.filter((i) => i.toolCallMatch).length, toolChecks.length),
    faithfulness: pct(faithfulChecks.filter((i) => i.faithful).length, faithfulChecks.length),
    avgLatencyMs: mean(completed.map((i) => i.latencyMs)),
    p95LatencyMs: percentile(completed.map((i) => i.latencyMs), 95),
    avgTokens: mean(completed.map((i) => i.totalTokens)),
    perItem,
  };
}
