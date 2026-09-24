/**
 * progress-preview-mockup.tsx — Decorative, static recreation of the
 * progress dashboard for the landing page. Illustrative only, not wired to
 * real data.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
const WEIGHT_POINTS = [62, 58, 60, 50, 48, 44, 40, 34, 30, 24, 18, 10];

export function ProgressPreviewMockup() {
  const points = WEIGHT_POINTS.map((y, i) => `${(i / (WEIGHT_POINTS.length - 1)) * 100},${y}`).join(
    " ",
  );

  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-12px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-xs font-medium text-muted-foreground">Weight trend</span>
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
          −4.2 kg
        </span>
      </div>

      <div className="p-4">
        <svg viewBox="0 0 100 64" className="h-28 w-full" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            className="stroke-brand"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-px border-t border-border bg-border">
        {[
          { label: "Consistency", value: "86%" },
          { label: "Workouts", value: "4/wk" },
          { label: "Protein", value: "94%" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card px-3 py-2.5 text-center">
            <p className="text-sm font-semibold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
