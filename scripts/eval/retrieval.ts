/**
 * retrieval.ts (eval) — Measures Recall@5 and MRR for the hybrid retrieval
 * pipeline against eval/dataset/rag.json, where each item's correct source
 * document is known ahead of time.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import { retrieveRelevantChunks } from "@/lib/rag/retrieve";
import { containsTitle, mean, pct, rankOfTitle } from "@/eval/metrics";
import { withRetry } from "@/eval/retry";

type RagItem = {
  id: string;
  query: string;
  expectedSourceTitle: string | null;
  queryType: string;
};

const MATCH_COUNT = 5;

export async function runRetrievalEval() {
  const supabase = createAdminClient();
  const raw = await readFile(
    path.join(process.cwd(), "eval", "dataset", "rag.json"),
    "utf-8",
  );
  const items = JSON.parse(raw) as RagItem[];

  const scoredItems = items.filter((item) => item.expectedSourceTitle);
  const reciprocalRanks: number[] = [];
  let hits = 0;
  const perItem: { id: string; query: string; hit: boolean; rank: number | null }[] = [];

  for (const item of items) {
    const chunks = await withRetry(() => retrieveRelevantChunks(supabase, item.query, MATCH_COUNT));
    const titles = chunks.map((c) => String(c.metadata.title ?? ""));

    if (!item.expectedSourceTitle) {
      perItem.push({ id: item.id, query: item.query, hit: true, rank: null });
      continue;
    }

    const hit = containsTitle(titles, item.expectedSourceTitle);
    const rank = rankOfTitle(titles, item.expectedSourceTitle);
    if (hit) hits += 1;
    reciprocalRanks.push(rank ? 1 / rank : 0);
    perItem.push({ id: item.id, query: item.query, hit, rank });
  }

  return {
    name: "retrieval" as const,
    recallAt5: pct(hits, scoredItems.length),
    mrr: mean(reciprocalRanks),
    itemCount: scoredItems.length,
    perItem,
  };
}
