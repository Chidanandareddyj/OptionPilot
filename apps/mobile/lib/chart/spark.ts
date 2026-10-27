import { type NormalizedStrategy } from "@optionpilot/shared";
import { strategyChart } from "./input";
import { windowCurve } from "./layout";

export type Spark = {
  /** SVG path data of the whole curve. */
  d: string;
  /** Height of the zero line, which splits the curve into profit above and loss below. */
  zeroY: number;
};

/** A small payoff curve in a `width` by `height` box, as the resume card and the compare rows draw it. */
export function sparkline(strategy: NormalizedStrategy, width: number, height: number): Spark | null {
  const chart = strategyChart(strategy, 0);
  const curve = windowCurve(chart.points, chart.defaultWindow);
  if (curve.length < 2) return null;

  const pnls = curve.map((p) => p.pnl);
  const lo = Math.min(...pnls, 0);
  const hi = Math.max(...pnls, 0);
  const pad = (hi - lo) * 0.1 || 1;
  const top = hi + pad;
  const bottom = lo - pad;
  const [first, last] = [curve[0].price, curve[curve.length - 1].price];
  const x = (price: number) => 2 + ((price - first) / (last - first || 1)) * (width - 4);
  const y = (pnl: number) => 2 + ((top - pnl) / (top - bottom)) * (height - 4);

  const d = curve.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.price).toFixed(1)},${y(p.pnl).toFixed(1)}`).join(" ");
  return { d, zeroY: y(0) };
}
