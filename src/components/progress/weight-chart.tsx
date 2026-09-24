/**
 * weight-chart.tsx — Line chart of logged bodyweight over time.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type WeightPoint = { recordedAt: string; weightKg: number };

export function WeightChart({ data }: { data: WeightPoint[] }) {
  if (data.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Log at least two weigh-ins to see your trend.
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <XAxis
            dataKey="recordedAt"
            tick={{ fontSize: 11 }}
            tickFormatter={(value: string) =>
              new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })
            }
          />
          <YAxis tick={{ fontSize: 11 }} domain={["dataMin - 2", "dataMax + 2"]} />
          <Tooltip
            labelFormatter={(value) => new Date(String(value)).toLocaleDateString()}
            formatter={(value) => [`${value} kg`, "Weight"]}
          />
          <Line
            type="monotone"
            dataKey="weightKg"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
