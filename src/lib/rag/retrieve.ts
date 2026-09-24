/**
 * retrieve.ts — Hybrid retrieval: embeds a query and fetches the top-k
 * knowledge base chunks via the hybrid_search_chunks Postgres function, which
 * combines vector similarity with keyword (full-text) search via Reciprocal
 * Rank Fusion. This catches both semantic/paraphrased queries and queries
 * that hinge on exact terms (exercise names, numbers, nutrient names) that
 * pure embedding similarity can miss.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { embedText } from "@/lib/ai/embeddings";

export type RetrievedChunk = {
  id: string;
  documentId: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
};

export async function retrieveRelevantChunks(
  supabase: SupabaseClient,
  query: string,
  matchCount = 5,
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedText(query);

  const { data, error } = await supabase.rpc("hybrid_search_chunks", {
    query_text: query,
    query_embedding: queryEmbedding,
    match_count: matchCount,
  });

  if (error) {
    throw new Error(`Retrieval failed: ${error.message}`);
  }

  type MatchRow = {
    id: string;
    document_id: string;
    content: string;
    metadata: Record<string, unknown> | null;
    score: number;
  };

  return ((data ?? []) as MatchRow[]).map((row) => ({
    id: row.id,
    documentId: row.document_id,
    content: row.content,
    metadata: row.metadata ?? {},
    score: row.score,
  }));
}

/**
 * Retrieves chunks like retrieveRelevantChunks, but restricted to a set of
 * knowledge-base categories (e.g. "exercise-form", "nutrition") — used by
 * the agent's more specific search_exercises/search_foods tools. Over-fetches
 * before filtering since the underlying function doesn't filter by category.
 */
export async function retrieveRelevantChunksByCategory(
  supabase: SupabaseClient,
  query: string,
  categories: string[],
  matchCount = 5,
): Promise<RetrievedChunk[]> {
  const overFetched = await retrieveRelevantChunks(supabase, query, matchCount * 4);
  return overFetched
    .filter((chunk) => categories.includes(String(chunk.metadata.category)))
    .slice(0, matchCount);
}

export function formatChunksAsContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((chunk, index) => `[Source ${index + 1}]\n${chunk.content}`)
    .join("\n\n");
}
