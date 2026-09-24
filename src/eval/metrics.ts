/**
 * metrics.ts — Shared statistics helpers for the eval suite (scripts/eval/*).
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index];
}

export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
}

/** True if `title` appears (case-insensitive substring) among `retrievedTitles`. */
export function containsTitle(retrievedTitles: string[], title: string): boolean {
  const needle = title.toLowerCase();
  return retrievedTitles.some((t) => t.toLowerCase().includes(needle) || needle.includes(t.toLowerCase()));
}

/** 1-indexed rank of the first matching title, or null if not found within the list. */
export function rankOfTitle(retrievedTitles: string[], title: string): number | null {
  const needle = title.toLowerCase();
  const index = retrievedTitles.findIndex(
    (t) => t.toLowerCase().includes(needle) || needle.includes(t.toLowerCase()),
  );
  return index === -1 ? null : index + 1;
}

/** Does the answer text cite the given source title in a parenthetical, e.g. "(Progressive Overload)"? */
export function textCitesTitle(text: string, title: string): boolean {
  const pattern = new RegExp(`\\(([^()]*${escapeRegExp(title)}[^()]*)\\)`, "i");
  return pattern.test(text);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
