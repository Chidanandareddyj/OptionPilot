import {
  extremeRegion,
  innerTicks,
  niceTicks,
  pnlAt,
  price as formatPrice,
  withZeroCrossings,
  type Limit,
  type PayoffPoint,
  type StrikeMarker,
} from "@optionpilot/shared";
import { money, signed } from "@/lib/analysis/format";

/** Space between the card edge and the plot: left for the y labels, bottom for the axis. */
export const CHART_MARGIN = { left: 44, top: 36, right: 20, bottom: 72 } as const;
/**
 * The canvas is this much wider than the layout on each side. The y labels are 44 px wide and the
 * design lets them spill into the card padding, so the canvas covers that padding too.
 */
export const CHART_BLEED = 8;
const MONO_CHAR = 7.2;
/** A breakeven label may start this far left of the plot, over the gap before the y labels. */
const Y_LABEL_GAP = 8;
const LABEL_WIDTH = 84;
export const BUBBLE = { width: 116, height: 48 } as const;
const SPOT_PILL_WIDTH = 92;

export type Rect = { x: number; y: number; width: number; height: number };
export type Align = "start" | "end";

export type ChartInput = {
  points: PayoffPoint[];
  /** The visible price range. Points outside it are cut, with the edges interpolated. */
  window: readonly [number, number];
  strikes: StrikeMarker[];
  breakevens: number[];
  spot?: number;
  maxProfit: Limit;
  maxLoss: Limit;
  width: number;
  height: number;
};

export type AxisLabel = { value: number; at: number; text: string };

export type StrikeGuide = { x: number; y: number; lines: [string] | [string, string] };

export type LimitLabel = { title: string; value: string; x: number; y: number; align: Align; kind: "profit" | "loss" };

export type BreakevenGuide = { x: number; text: string; align: Align; textX: number; rect: Rect };

export type ChartLayout = {
  width: number;
  height: number;
  plot: { left: number; top: number; right: number; bottom: number };
  zeroY: number;
  window: readonly [number, number];
  curve: PayoffPoint[];
  xOf: (priceValue: number) => number;
  yOf: (pnl: number) => number;
  priceAt: (x: number) => number;
  yTicks: AxisLabel[];
  xTicks: AxisLabel[];
  ruler: { x: number; major: boolean; price: number }[];
  strikes: StrikeGuide[];
  spot: { x: number; label: string; pill: Rect } | null;
  breakevens: BreakevenGuide[];
  profit: LimitLabel | null;
  loss: LimitLabel | null;
  /** Areas the scrub bubble must stay clear of. */
  avoid: Rect[];
};

const overlaps = (a: Rect, b: Rect) =>
  !(a.x + a.width <= b.x || a.x >= b.x + b.width || a.y + a.height <= b.y || a.y >= b.y + b.height);

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

/** The curve cut to the window, with the cut edges interpolated and zero crossings inserted. */
export function windowCurve(points: PayoffPoint[], [low, high]: readonly [number, number]): PayoffPoint[] {
  if (points.length === 0) return [];
  const inside = points.filter((p) => p.price > low && p.price < high);
  const edges = [low, high].map((priceValue) => ({ price: priceValue, pnl: pnlAt(points, priceValue) }));
  return withZeroCrossings([edges[0], ...inside, edges[1]]);
}

/** Splits "Buy 1,180 CE" into the two lines drawn under the axis; other labels stay on one line. */
export function strikeLines(label: string): [string] | [string, string] {
  const match = /^(Buy|Sell)( \d+×)? (.+)$/.exec(label);
  return match ? [`${match[1]}${match[2] ?? ""}`, match[3]] : [label];
}

function limitText(kind: "profit" | "loss", limit: Limit, fallback: number): string {
  if (limit === "Unlimited") return "Unlimited";
  const amount = typeof limit === "number" ? Math.abs(limit) : Math.abs(fallback);
  return signed(kind === "profit" ? amount : -amount);
}

export function layoutChart(input: ChartInput): ChartLayout {
  const { width, height, window: range, spot } = input;
  const plot = {
    left: CHART_MARGIN.left,
    top: CHART_MARGIN.top,
    right: width - CHART_MARGIN.right,
    bottom: height - CHART_MARGIN.bottom,
  };
  const [xmin, xmax] = range;
  const curve = windowCurve(input.points, range);

  const pnls = curve.map((p) => p.pnl);
  const hi = Math.max(...pnls, 0);
  const lo = Math.min(...pnls, 0);
  const span = hi - lo || 1;
  const y = niceTicks(lo - span * 0.08, hi + span * 0.14, 7);
  const [ymin, ymax] = y.domain;

  const xOf = (value: number) => plot.left + ((value - xmin) / (xmax - xmin || 1)) * (plot.right - plot.left);
  const yOf = (value: number) => plot.top + ((ymax - value) / (ymax - ymin || 1)) * (plot.bottom - plot.top);
  const priceAt = (x: number) =>
    clamp(xmin + ((x - plot.left) / (plot.right - plot.left || 1)) * (xmax - xmin), xmin, xmax);
  const zeroY = yOf(0);

  const xTickValues = innerTicks(xmin, xmax, 5);
  const tickStep = xTickValues.length > 1 ? xTickValues[1] - xTickValues[0] : (xmax - xmin) / 5;
  const rulerStep = tickStep / 20;
  const ruler: ChartLayout["ruler"] = [];
  if (rulerStep > 0) {
    for (let v = Math.ceil(xmin / rulerStep) * rulerStep, n = 0; v <= xmax && n < 400; v += rulerStep, n += 1) {
      const rounded = Number(v.toFixed(6));
      ruler.push({ x: xOf(rounded), price: rounded, major: Math.abs((rounded / (tickStep / 2)) % 1) < 1e-6 });
    }
  }

  const strikes = input.strikes
    .filter((s) => s.price >= xmin && s.price <= xmax)
    .map((s) => ({ x: xOf(s.price), y: yOf(pnlAt(input.points, s.price)), lines: strikeLines(s.label) }));

  const spotLayout =
    spot !== undefined && spot >= xmin && spot <= xmax
      ? (() => {
          const x = xOf(spot);
          const pillX = clamp(x - SPOT_PILL_WIDTH / 2, plot.left, plot.right - SPOT_PILL_WIDTH);
          return { x, label: `Spot ${money(spot)}`, pill: { x: pillX, y: 2, width: SPOT_PILL_WIDTH, height: 24 } };
        })()
      : null;

  const rawPoints = input.points;
  const peak = extremeRegion(rawPoints, "max");
  const trough = extremeRegion(rawPoints, "min");
  const profitSide = peak?.side ?? "right";
  const lossSide = trough?.side === profitSide ? (profitSide === "right" ? "left" : "right") : (trough?.side ?? "left");
  const alignOf = (side: "left" | "right"): Align => (side === "left" ? "start" : "end");
  const labelX = (side: "left" | "right") => (side === "left" ? plot.left + 4 : plot.right - 4);

  const profit: LimitLabel | null =
    input.maxProfit !== null && hi > 0
      ? { kind: "profit", title: "Max profit", value: limitText("profit", input.maxProfit, hi), x: labelX(profitSide), y: yOf(hi) - 20, align: alignOf(profitSide) }
      : null;
  const loss: LimitLabel | null =
    input.maxLoss !== null && lo < 0
      ? { kind: "loss", title: "Max loss", value: limitText("loss", input.maxLoss, lo), x: labelX(lossSide), y: yOf(lo) - 20, align: alignOf(lossSide) }
      : null;

  const limitRect = (label: LimitLabel): Rect => ({
    x: label.align === "start" ? label.x : label.x - LABEL_WIDTH,
    y: label.y - 14,
    width: LABEL_WIDTH,
    height: 32,
  });

  const breakevens = input.breakevens
    .filter((b) => b > xmin && b < xmax)
    .map((b, i, all): BreakevenGuide => {
      const text = `Breakeven ${money(b)}`;
      const textWidth = text.length * MONO_CHAR;
      const x = xOf(b);
      const preferred: "left" | "right" =
        all.length > 1 ? (i === 0 ? "left" : "right") : spot !== undefined && b > spot ? "right" : "left";
      const side =
        preferred === "right" && x + 10 + textWidth > plot.right
          ? "left"
          : preferred === "left" && x - 10 - textWidth < plot.left - Y_LABEL_GAP
            ? "right"
            : preferred;
      const x0 = side === "left" ? x - 10 - textWidth : x + 10;
      return {
        x,
        text,
        align: side === "left" ? "end" : "start",
        textX: side === "left" ? x - 10 : x + 10,
        rect: { x: x0, y: zeroY - 26, width: textWidth, height: 20 },
      };
    });

  const avoid: Rect[] = [
    ...(profit ? [limitRect(profit)] : []),
    ...(loss ? [limitRect(loss)] : []),
    ...(spotLayout ? [{ ...spotLayout.pill, y: 0, height: 30 }] : []),
    ...breakevens.map((b) => b.rect),
  ];

  return {
    width,
    height,
    plot,
    zeroY,
    window: range,
    curve,
    xOf,
    yOf,
    priceAt,
    yTicks: y.ticks.map((value) => ({ value, at: yOf(value), text: value === 0 ? "0" : signed(value) })),
    xTicks: xTickValues.map((value) => ({ value, at: xOf(value), text: formatPrice(value) })),
    ruler,
    strikes,
    spot: spotLayout,
    breakevens,
    profit,
    loss,
    avoid,
  };
}

export type ScrubReadout = {
  price: number;
  pnl: number;
  x: number;
  y: number;
  bubble: Rect;
  pill: Rect;
  title: string;
  value: string;
  tone: "profit" | "loss" | "neutral";
  pillText: string;
};

/** Where the readout sits when a finger is on the chart at x. */
export function layoutScrub(layout: ChartLayout, points: PayoffPoint[], x: number): ScrubReadout {
  const { plot } = layout;
  const price = Math.round(layout.priceAt(x));
  const pnl = pnlAt(points, price);
  const cx = layout.xOf(price);
  const cy = layout.yOf(pnl);

  const curve = layout.curve.map((p) => ({ x: layout.xOf(p.price), y: layout.yOf(p.pnl) }));
  const touchesCurve = (r: Rect) => {
    for (let i = 1; i < curve.length; i += 1) {
      const a = curve[i - 1];
      const b = curve[i];
      for (let t = 0; t <= 1; t += 0.05) {
        const px = a.x + (b.x - a.x) * t;
        const py = a.y + (b.y - a.y) * t;
        if (px > r.x - 3 && px < r.x + r.width + 3 && py > r.y - 3 && py < r.y + r.height + 3) return true;
      }
    }
    return false;
  };

  /** The free spot nearest the point, on the side with room. `clearOfLabels` keeps off the text labels. */
  const place = (clearOfLabels: boolean): Rect | null => {
    let best: { cost: number; rect: Rect } | null = null;
    for (const side of [1, -1]) {
      for (let top = plot.top + 4; top <= plot.bottom - 4 - BUBBLE.height; top += 4) {
        const left = side === 1 ? cx + 14 : cx - 14 - BUBBLE.width;
        const rect = { x: left, y: top, ...BUBBLE };
        if (left < plot.left || left + BUBBLE.width > plot.right + 8) continue;
        if (touchesCurve(rect)) continue;
        if (clearOfLabels && layout.avoid.some((a) => overlaps(rect, a))) continue;
        const cost = Math.abs(top + BUBBLE.height / 2 - cy) + (side === 1 ? 0 : 6);
        if (!best || cost < best.cost) best = { cost, rect };
      }
    }
    return best?.rect ?? null;
  };
  // A bubble that covers a label for a moment beats one that sits on the curve or leaves the plot.
  const bubble = place(true) ?? place(false) ?? {
    x: Math.min(cx + 14, plot.right + 8 - BUBBLE.width),
    y: clamp(cy + 16, plot.top, plot.bottom - BUBBLE.height),
    ...BUBBLE,
  };

  const pillWidth = 52;
  return {
    price,
    pnl,
    x: cx,
    y: cy,
    bubble,
    pill: { x: cx - pillWidth / 2, y: plot.bottom + 14, width: pillWidth, height: 20 },
    title: `At ${formatPrice(price)} expiry`,
    value: `${signed(pnl)} P&L`,
    tone: pnl > 0 ? "profit" : pnl < 0 ? "loss" : "neutral",
    pillText: formatPrice(price),
  };
}

/** A breakeven label is dropped while the scrub bubble would cover it. */
export const breakevenLabelVisible = (guide: BreakevenGuide, scrub: ScrubReadout | null) =>
  !scrub || !overlaps(scrub.bubble, guide.rect);

/**
 * The window after a pinch. `scale` above 1 zooms in. The price under the fingers stays put, the
 * span stays between a tenth of the full range and all of it, and the window stays inside `bounds`.
 * `focal` is where the fingers are across the plot, 0 on the left edge and 1 on the right.
 */
export function zoomWindow(
  window: readonly [number, number],
  bounds: readonly [number, number],
  scale: number,
  focal = 0.5,
): [number, number] {
  const [low, high] = window;
  const full = bounds[1] - bounds[0];
  if (!(scale > 0) || !(full > 0)) return [low, high];
  const span = Math.min(full, Math.max(full / 10, (high - low) / scale));
  const anchor = low + (high - low) * focal;
  const start = Math.min(Math.max(anchor - span * focal, bounds[0]), bounds[1] - span);
  return [start, start + span];
}
