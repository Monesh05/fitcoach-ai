/**
 * route-loading-skeleton.tsx — Instant-paint fallback shown by each
 * authenticated route's loading.tsx while its server component fetches data,
 * shaped like the real AppShell so navigation doesn't flash to a blank page.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import { Dumbbell } from "lucide-react";

export function RouteLoadingSkeleton() {
  return (
    <div className="flex h-svh flex-col sm:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar sm:flex">
        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
            <Dumbbell className="size-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight">FitCoach AI</span>
        </div>
        <div className="flex flex-col gap-2 px-3 pb-3">
          <div className="h-8 animate-pulse rounded-md bg-muted" />
          <div className="h-8 animate-pulse rounded-md bg-muted/60" />
        </div>
        <div className="flex flex-col gap-1 px-2 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded-md bg-muted/40" style={{ animationDelay: `${i * 75}ms` }} />
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center border-b border-border px-4 sm:px-6">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </header>
        <main className="flex flex-1 items-center justify-center overflow-hidden">
          <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-brand" />
        </main>
      </div>
    </div>
  );
}
