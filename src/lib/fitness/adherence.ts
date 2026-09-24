/**
 * adherence.ts — Counts distinct training days logged in recent windows.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */

export function countDistinctTrainingDays(
  performedDates: string[],
  windowDays: number,
  now: number = Date.now(),
): number {
  const cutoff = now - windowDays * 24 * 60 * 60 * 1000;
  const withinWindow = performedDates.filter((date) => new Date(date).getTime() >= cutoff);
  return new Set(withinWindow).size;
}
