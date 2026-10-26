import type { NormalizedStrategy } from "@optionpilot/shared";
import { money, signed } from "./format";
import { roiBase, type Stat } from "./model";

export type CompareRow = {
  key: string;
  /** "01": where the row sits in the list now. */
  position: string;
  name: string;
  /** "ROI 400%". */
  roi: string;
  /** The leg strikes in leg order: "1180 / 1200". */
  strikes: string;
  stats: Stat[];
  strategy: NormalizedStrategy;
};

/** Profit at the best case over what is put at risk. "Unlimited" for an open top, "—" when the base is unknown. */
export function roiText(strategy: NormalizedStrategy): string {
  const base = roiBase(strategy);
  if (base === null) return "—";
  if (strategy.maxProfit === "Unlimited") return "Unlimited";
  if (typeof strategy.maxProfit !== "number") return "—";
  return `${Math.round((strategy.maxProfit / base) * 100).toLocaleString("en-IN")}%`;
}

/** Strikes in leg order, each once: a straddle's two legs share one strike. */
export function strikeList(strategy: NormalizedStrategy): string {
  return [...new Set(strategy.legs.map((leg) => leg.strike))].join(" / ");
}

const limit = (label: string, value: NormalizedStrategy["maxProfit"], tone: Stat["tone"], sign: 1 | -1): Stat => ({
  label,
  tone,
  value: typeof value === "number" ? signed(sign * Math.abs(value)) : (value ?? "—"),
});

/** One list row per strategy, numbered from 1 in the order given. */
export function compareRows(strategies: NormalizedStrategy[]): CompareRow[] {
  return strategies.map((strategy, index) => ({
    key: strategy.key,
    position: String(index + 1).padStart(2, "0"),
    name: strategy.name,
    roi: `ROI ${roiText(strategy)}`,
    strikes: strikeList(strategy),
    stats: [
      { label: strategy.costOrCredit.label, value: money(strategy.costOrCredit.amount, 0), tone: undefined },
      limit("Max profit", strategy.maxProfit, "profit", 1),
      limit("Max loss", strategy.maxLoss, "loss", -1),
    ],
    strategy,
  }));
}
