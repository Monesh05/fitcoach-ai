/**
 * embeddings.ts — Text embeddings via Google's free-tier gemini-embedding-001
 * model, truncated to 768 dimensions (matryoshka representation learning) to
 * match the document_chunks.embedding column, used for ingestion and
 * query-time retrieval.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */

const GEMINI_EMBEDDING_MODEL = "models/gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;
const GEMINI_EMBEDDING_URL = `https://generativelanguage.googleapis.com/v1beta/${GEMINI_EMBEDDING_MODEL}:embedContent`;

export class EmbeddingError extends Error {}

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new EmbeddingError("Missing GOOGLE_API_KEY env var.");
  }

  const response = await fetch(`${GEMINI_EMBEDDING_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GEMINI_EMBEDDING_MODEL,
      content: { parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new EmbeddingError(`Gemini embedding request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;
  if (!values) {
    throw new EmbeddingError("Gemini embedding response missing values.");
  }

  return values;
}
