/**
 * personalization-preview-mockup.tsx — Decorative preview of the
 * onboarding -> plan flow for the landing page.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import { CheckCircle2 } from "lucide-react";

const ROWS = [
  { label: "Goal", value: "Build muscle" },
  { label: "Experience", value: "Intermediate" },
  { label: "Training", value: "5 days / week" },
  { label: "Nutrition", value: "High protein" },
];

export function PersonalizationPreviewMockup() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-12px_rgba(0,0,0,0.12)]">
      <div className="divide-y divide-border">
        {ROWS.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span className="text-sm font-medium">{row.value}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-border bg-brand/5 px-4 py-3">
        <CheckCircle2 className="size-4 text-brand" />
        <span className="text-sm font-medium text-brand">Your plan is ready</span>
      </div>
    </div>
  );
}
