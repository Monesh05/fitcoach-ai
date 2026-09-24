/**
 * loading.tsx (plans/generating) — Overrides the parent plans/loading.tsx
 * (which is sidebar-shaped) with a plain full-screen fallback, since this
 * transitional screen intentionally has no AppShell.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-brand" />
    </div>
  );
}
