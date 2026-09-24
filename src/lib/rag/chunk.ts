/**
 * chunk.ts — Splits long documents into overlapping word-based chunks for
 * embedding and retrieval.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */

const DEFAULT_CHUNK_SIZE_WORDS = 350;
const DEFAULT_CHUNK_OVERLAP_WORDS = 60;

export function chunkText(
  text: string,
  chunkSizeWords: number = DEFAULT_CHUNK_SIZE_WORDS,
  overlapWords: number = DEFAULT_CHUNK_OVERLAP_WORDS,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= chunkSizeWords) {
    return [words.join(" ")];
  }

  const chunks: string[] = [];
  const step = chunkSizeWords - overlapWords;

  for (let start = 0; start < words.length; start += step) {
    const chunk = words.slice(start, start + chunkSizeWords).join(" ");
    chunks.push(chunk);
    if (start + chunkSizeWords >= words.length) break;
  }

  return chunks;
}
