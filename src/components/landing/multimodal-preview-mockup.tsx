/**
 * multimodal-preview-mockup.tsx — Decorative side-by-side illustration of
 * meal-photo and lifting-form analysis for the landing page. Illustrative
 * only — uses icon placeholders rather than stock photography.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import { Salad, PersonStanding, CheckCircle2 } from "lucide-react";

export function MultimodalPreviewMockup() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-12px_rgba(0,0,0,0.12)]">
        <div className="flex aspect-[4/3] items-center justify-center bg-muted/50">
          <Salad className="size-10 text-muted-foreground/50" strokeWidth={1.25} />
        </div>
        <div className="space-y-2 p-4">
          <p className="text-xs font-medium text-muted-foreground">Meal analysis</p>
          <p className="text-sm leading-relaxed">
            Grilled chicken, rice, and greens — approx.{" "}
            <span className="font-medium text-foreground">620 kcal, 48g protein</span>.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-brand">
            <CheckCircle2 className="size-3.5" />
            Fits your calorie target
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-12px_rgba(0,0,0,0.12)]">
        <div className="flex aspect-[4/3] items-center justify-center bg-muted/50">
          <PersonStanding className="size-10 text-muted-foreground/50" strokeWidth={1.25} />
        </div>
        <div className="space-y-2 p-4">
          <p className="text-xs font-medium text-muted-foreground">Form feedback</p>
          <p className="text-sm leading-relaxed">
            Good depth on your squat — watch your{" "}
            <span className="font-medium text-foreground">knee tracking</span> on the descent.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-brand">
            <CheckCircle2 className="size-3.5" />
            Grounded in exercise-form guides
          </div>
        </div>
      </div>
    </div>
  );
}
