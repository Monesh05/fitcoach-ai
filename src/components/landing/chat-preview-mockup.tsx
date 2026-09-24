/**
 * chat-preview-mockup.tsx — Decorative, static recreation of the real chat UI
 * for the landing page hero. Not wired to any backend — marketing-only
 * illustrative content, isolated from real app data per design brief.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import { Dumbbell, Sparkles } from "lucide-react";

export function ChatPreviewMockup() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-12px_rgba(0,0,0,0.12)]">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex size-6 items-center justify-center rounded-md bg-brand/10">
          <Dumbbell className="size-3.5 text-brand" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">FitCoach AI</span>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-foreground px-3.5 py-2 text-sm text-background">
          How much protein should I eat to build muscle?
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10">
              <Sparkles className="size-3 text-brand" />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-border bg-muted/40 px-3.5 py-2 text-sm leading-relaxed">
              Aim for <span className="font-medium text-foreground">1.6–2.2g per kg</span> of
              bodyweight daily, spread across 3–4 meals for best results.
            </div>
          </div>

          <div className="ml-8 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-brand" />
              Protein Intake for Muscle Growth
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Daily target
          </p>
          <p className="text-sm font-semibold">2,400 kcal</p>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Protein
          </p>
          <p className="text-sm font-semibold">158g / day</p>
        </div>
      </div>
    </div>
  );
}
