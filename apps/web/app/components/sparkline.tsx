"use client";

import { ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { toSeries, type PayoffPoint } from "@/lib/payoff-series";

const config = {
  pos: { label: "Profit", color: "var(--profit)" },
  neg: { label: "Loss", color: "var(--loss)" },
} satisfies ChartConfig;

export function Sparkline({ points, width = 96, height = 32 }: { points: PayoffPoint[]; width?: number; height?: number }) {
  if (points.length < 2) return <span className="text-faint">—</span>;
  const data = toSeries(points);
  const values = points.map((p) => p.pnl);
  const lo = Math.min(...values, 0);
  const hi = Math.max(...values, 0);
  const pad = (hi - lo || 1) * 0.12;
  return (
    <ChartContainer
      config={config}
      aria-hidden
      className="aspect-auto"
      style={{ width, height }}
      initialDimension={{ width, height }}
    >
      <ComposedChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <XAxis type="number" dataKey="price" domain={["dataMin", "dataMax"]} hide />
        <YAxis domain={[lo - pad, hi + pad]} hide />
        <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} strokeDasharray="1 3" />
        <Line dataKey="pos" type="linear" stroke="var(--color-pos)" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
        <Line dataKey="neg" type="linear" stroke="var(--color-neg)" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
      </ComposedChart>
    </ChartContainer>
  );
}
