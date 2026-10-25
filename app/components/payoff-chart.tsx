"use client";

import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import {
  compactSigned,
  extremeRegion,
  innerTicks,
  niceTicks,
  pnlAt,
  price,
  signedInr,
  toSeries,
  type PayoffPoint,
} from "@/lib/payoff-series";

const config = {
  profit: { label: "Profit", color: "var(--profit)" },
  loss: { label: "Loss", color: "var(--loss)" },
  pnl: { label: "P&L", color: "var(--foreground)" },
} satisfies ChartConfig;

type ViewBox = { x: number; y: number; width: number; height: number };
type LabelProps = { viewBox?: ViewBox };

export type StrikeMarker = { price: number; label: string };
export type ChartLimit = number | "Unlimited" | null;

export type PayoffChartProps = {
  points: PayoffPoint[];
  spot?: number;
  breakevens?: number[];
  strikes?: StrikeMarker[];
  maxProfit?: ChartLimit;
  maxLoss?: ChartLimit;
  height?: number;
  /** Schematic mode: shape and labels only, no figures or tooltip. */
  illustrative?: boolean;
  className?: string;
};

const HALO = { stroke: "var(--background)", strokeWidth: 4, style: { paintOrder: "stroke" } } as const;

function Tip({ active, payload }: { active?: boolean; payload?: { payload: PayoffPoint }[] }) {
  if (!active || !payload?.length) return null;
  const { price: x, pnl } = payload[0].payload;
  return (
    <div className="rounded-lg bg-popover px-3 py-2 text-xs ring-1 ring-foreground/15">
      <div className="text-muted-foreground">At {price(x)} expiry</div>
      <div className={cn("num text-sm font-medium", pnl > 0 ? "text-profit" : pnl < 0 ? "text-loss" : "text-foreground")}>
        {signedInr(pnl)} P&amp;L
      </div>
    </div>
  );
}

function SpotLabel({ viewBox, text }: LabelProps & { text: string }) {
  if (!viewBox) return null;
  const width = text.length * 7 + 16;
  return (
    <g>
      <rect x={viewBox.x - width / 2} y={viewBox.y - 28} width={width} height={24} rx={4} fill="var(--primary)" />
      <text x={viewBox.x} y={viewBox.y - 12} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--primary-foreground)">
        {text}
      </text>
    </g>
  );
}

function SideLabel({
  viewBox,
  value,
  sub,
  color,
  side,
  dy,
}: LabelProps & { value: string; sub?: string; color: string; side: "left" | "right"; dy: number }) {
  if (!viewBox) return null;
  const x = side === "right" ? viewBox.x + viewBox.width - 8 : viewBox.x + 8;
  const anchor = side === "right" ? "end" : "start";
  return (
    <g className="num">
      <text x={x} y={viewBox.y + dy} textAnchor={anchor} fontSize={14} fontWeight={600} fill={color} {...HALO}>
        {value}
      </text>
      {sub && (
        <text
          x={x}
          y={viewBox.y + dy + 16}
          textAnchor={anchor}
          fontSize={12}
          fill="var(--muted-foreground)"
          {...HALO}
          style={{ ...HALO.style, fontFamily: "var(--font-sans)" }}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function StrikeLabel({ viewBox, text, row }: LabelProps & { text: string; row: number }) {
  if (!viewBox) return null;
  return (
    <text x={viewBox.x} y={viewBox.y + viewBox.height + 40 + row * 16} textAnchor="middle" fontSize={12} fill="var(--muted-foreground)">
      {text}
    </text>
  );
}

function BreakevenLabel({ viewBox, text, side }: LabelProps & { text: string; side: "left" | "right" }) {
  if (!viewBox) return null;
  const cx = viewBox.x + viewBox.width / 2;
  const cy = viewBox.y + viewBox.height / 2;
  return (
    <text
      className="num"
      x={side === "right" ? cx + 12 : cx - 12}
      y={cy - 12}
      textAnchor={side === "right" ? "start" : "end"}
      fontSize={13}
      fill="var(--foreground)"
      {...HALO}
    >
      {text}
    </text>
  );
}

function limitText(kind: "profit" | "loss", limit: ChartLimit | undefined, illustrative: boolean) {
  const word = kind === "profit" ? "Max profit" : "Max loss";
  if (illustrative || limit === undefined || limit === null) return word;
  if (limit === "Unlimited") return `${word} unlimited`;
  return `${word} ${signedInr(kind === "profit" ? Math.abs(limit) : -Math.abs(limit))}`;
}

export function PayoffChart({
  points,
  spot,
  breakevens = [],
  strikes = [],
  maxProfit,
  maxLoss,
  height = 360,
  illustrative = false,
  className,
}: PayoffChartProps) {
  const data = toSeries(points);
  const xmin = points[0].price;
  const xmax = points.at(-1)!.price;
  const hi = Math.max(...points.map((p) => p.pnl), 0);
  const lo = Math.min(...points.map((p) => p.pnl), 0);
  const span = hi - lo || 1;
  const y = niceTicks(lo - span * 0.22, hi + span * 0.14, 5);
  const xticks = innerTicks(xmin, xmax, 6);

  const peak = extremeRegion(points, "max");
  const trough = extremeRegion(points, "min");
  const profitSide = peak?.side ?? "right";
  const lossSide = trough?.side === profitSide ? (profitSide === "right" ? "left" : "right") : (trough?.side ?? "left");
  const unboundedHint = (side: "left" | "right") => (side === "right" ? "Keeps growing as price rises" : "Keeps growing as price falls");

  const visibleStrikes = strikes.filter((s) => s.price >= xmin && s.price <= xmax);
  const staggered = visibleStrikes.length > 2;
  const visibleBreakevens = breakevens.filter((b) => b > xmin && b < xmax);
  const showSpot = spot !== undefined && spot >= xmin && spot <= xmax;

  const summary = illustrative
    ? "Illustrative payoff diagram"
    : `Expiry payoff from ${price(xmin)} to ${price(xmax)}. ${limitText("profit", maxProfit ?? hi, false)}. ${limitText("loss", maxLoss ?? lo, false)}.`;

  return (
    <ChartContainer
      config={config}
      role="img"
      aria-label={summary}
      className={cn("aspect-auto w-full [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground", className)}
      style={{ height }}
    >
      <ComposedChart data={data} margin={{ top: 36, right: 24, bottom: 8, left: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          type="number"
          dataKey="price"
          domain={[xmin, xmax]}
          ticks={xticks}
          tick={!illustrative}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v: number) => price(v)}
          height={staggered ? 72 : 52}
          className="num"
        />
        <YAxis
          type="number"
          domain={y.domain}
          ticks={y.ticks}
          tick={!illustrative}
          tickLine={false}
          axisLine={false}
          width={illustrative ? 8 : 64}
          tickMargin={4}
          tickFormatter={compactSigned}
          className="num"
        />
        <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.6} />
        <Area dataKey="profit" type="linear" baseValue={0} fill="var(--color-profit)" fillOpacity={0.2} stroke="none" isAnimationActive={false} activeDot={false} />
        <Area dataKey="loss" type="linear" baseValue={0} fill="var(--color-loss)" fillOpacity={0.2} stroke="none" isAnimationActive={false} activeDot={false} />
        {visibleStrikes.map((s, i) => (
          <ReferenceLine
            key={s.price}
            x={s.price}
            stroke="var(--border)"
            strokeDasharray="2 4"
            label={(p: LabelProps) => <StrikeLabel viewBox={p.viewBox} text={s.label} row={staggered ? i % 2 : 0} />}
          />
        ))}
        {showSpot && (
          <ReferenceLine
            x={spot}
            stroke="var(--primary)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            label={(p: LabelProps) => <SpotLabel viewBox={p.viewBox} text={illustrative ? "Spot" : `Spot ${price(spot, 2)}`} />}
          />
        )}
        {maxProfit !== null && (
          <ReferenceLine
            y={hi}
            stroke="none"
            label={(p: LabelProps) => (
              <SideLabel
                viewBox={p.viewBox}
                value={limitText("profit", maxProfit ?? hi, illustrative)}
                sub={maxProfit === "Unlimited" ? unboundedHint(profitSide) : illustrative ? undefined : peak?.hint}
                color="var(--profit)"
                side={profitSide}
                dy={-24}
              />
            )}
          />
        )}
        {maxLoss !== null && (
          <ReferenceLine
            y={lo}
            stroke="none"
            label={(p: LabelProps) => (
              <SideLabel
                viewBox={p.viewBox}
                value={limitText("loss", maxLoss ?? lo, illustrative)}
                sub={maxLoss === "Unlimited" ? unboundedHint(lossSide) : illustrative ? undefined : trough?.hint}
                color="var(--loss)"
                side={lossSide}
                dy={28}
              />
            )}
          />
        )}
        <Line
          dataKey="pnl"
          type="linear"
          stroke="var(--color-pnl)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          activeDot={illustrative ? false : { r: 5, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 2 }}
        />
        {visibleStrikes.map((s) => (
          <ReferenceDot key={s.price} x={s.price} y={pnlAt(points, s.price)} r={5} fill="var(--card)" stroke="var(--foreground)" strokeWidth={2} />
        ))}
        {visibleBreakevens.map((b, i) => {
          const side = visibleBreakevens.length > 1 ? (i === 0 ? "left" : "right") : spot !== undefined && b > spot ? "right" : "left";
          return (
            <ReferenceDot
              key={b}
              x={b}
              y={0}
              r={5}
              fill="var(--foreground)"
              stroke="var(--card)"
              strokeWidth={2}
              label={(p: LabelProps) => (
                <BreakevenLabel viewBox={p.viewBox} side={side} text={illustrative ? "Breakeven" : `Breakeven ${price(b, 2)}`} />
              )}
            />
          );
        })}
        {!illustrative && <ChartTooltip cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }} content={<Tip />} />}
      </ComposedChart>
    </ChartContainer>
  );
}
