export type PayoffPoint = { price: number; pnl: number };

export type SeriesRow = PayoffPoint & {
  profit: number;
  loss: number;
  pos: number | null;
  neg: number | null;
};

const MINUS = "\u2212";

/** Inserts exact zero crossings so the profit and loss fills meet on the axis. */
export function withZeroCrossings(points: PayoffPoint[]): PayoffPoint[] {
  const out: PayoffPoint[] = [];
  points.forEach((p, i) => {
    const prev = points[i - 1];
    if (prev && Math.sign(prev.pnl) * Math.sign(p.pnl) < 0) {
      const t = prev.pnl / (prev.pnl - p.pnl);
      out.push({ price: prev.price + t * (p.price - prev.price), pnl: 0 });
    }
    out.push(p);
  });
  return out;
}

/** Rows for Recharts: area fills split at zero and line segments split by sign. */
export function toSeries(points: PayoffPoint[]): SeriesRow[] {
  return withZeroCrossings(points).map((p) => ({
    ...p,
    profit: Math.max(p.pnl, 0),
    loss: Math.min(p.pnl, 0),
    pos: p.pnl >= 0 ? p.pnl : null,
    neg: p.pnl <= 0 ? p.pnl : null,
  }));
}

export function pnlAt(points: PayoffPoint[], price: number): number {
  const i = points.findIndex((p) => p.price >= price);
  if (i <= 0) return points[Math.max(i, 0)]?.pnl ?? 0;
  const a = points[i - 1];
  const b = points[i];
  return a.pnl + ((price - a.price) / (b.price - a.price || 1)) * (b.pnl - a.pnl);
}

function niceStep(range: number, count: number) {
  const raw = range / Math.max(count, 1);
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

/** Evenly spaced round ticks covering [min, max], plus the domain they span. */
export function niceTicks(min: number, max: number, count = 5) {
  const step = niceStep(max - min, count);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(6)));
  return { ticks, domain: [lo, hi] as [number, number] };
}

/** Ticks strictly inside [min, max] so the x domain stays on the data. */
export function innerTicks(min: number, max: number, count = 6) {
  const step = niceStep(max - min, count);
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

export const price = (v: number, digits = 0) =>
  v.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Rupee amount with an explicit sign, so profit and loss never rely on colour. */
export const signedInr = (v: number, digits = 0) => {
  const abs = `₹${price(Math.abs(digits ? v : Math.round(v)), digits)}`;
  return v > 0 ? `+${abs}` : v < 0 ? `${MINUS}${abs}` : abs;
};

export const compactSigned = (v: number) => {
  const abs = Math.abs(v);
  const body =
    abs >= 1e7 ? `${+(abs / 1e7).toFixed(1)}Cr` : abs >= 1e5 ? `${+(abs / 1e5).toFixed(1)}L` : abs >= 1e3 ? `${+(abs / 1e3).toFixed(1)}k` : `${Math.round(abs)}`;
  return v > 0 ? `+${body}` : v < 0 ? `${MINUS}${body}` : "0";
};

export type ExtremeRegion = { hint: string; side: "left" | "right" };

/**
 * Describes where the curve sits at its extreme (e.g. "Above 1,200 at expiry")
 * and which half of the chart the label belongs on.
 */
export function extremeRegion(points: PayoffPoint[], kind: "max" | "min"): ExtremeRegion | null {
  if (points.length < 2) return null;
  const values = points.map((p) => p.pnl);
  const target = kind === "max" ? Math.max(...values) : Math.min(...values);
  const tolerance = Math.max(Math.abs(target) * 0.001, 0.01);
  const hits = points.map((p) => Math.abs(p.pnl - target) <= tolerance);

  const runs: [number, number][] = [];
  hits.forEach((hit, i) => {
    if (!hit) return;
    const last = runs.at(-1);
    if (last && last[1] === i - 1) last[1] = i;
    else runs.push([i, i]);
  });
  if (runs.length === 0) return null;

  const lastIndex = points.length - 1;
  const mid = (points[0].price + points[lastIndex].price) / 2;
  const first = runs[0];
  const final = runs.at(-1)!;
  const at = (i: number) => price(points[i].price);

  if (runs.length > 1 && first[0] === 0 && final[1] === lastIndex) {
    return { hint: `Below ${at(first[1])} or above ${at(final[0])}`, side: "right" };
  }
  if (first[0] === 0 && first[1] === lastIndex) return { hint: "Across the range", side: "right" };
  if (first[0] === 0) return { hint: `Below ${at(first[1])} at expiry`, side: "left" };
  if (final[1] === lastIndex) return { hint: `Above ${at(final[0])} at expiry`, side: "right" };

  const [a, b] = first;
  const centre = (points[a].price + points[b].price) / 2;
  return {
    hint: a === b ? `At ${at(a)} at expiry` : `Between ${at(a)} and ${at(b)}`,
    side: centre > mid ? "left" : "right",
  };
}
