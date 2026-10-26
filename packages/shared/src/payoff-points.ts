import type { PayoffPoint } from "./payoff-series";
import type { Leg, PayoffRow } from "./types";

export type StrikeMarker = { price: number; label: string };

export function payoffPoints(table: PayoffRow[]): PayoffPoint[] {
  return table
    .filter((r) => typeof r?.closing_price === "number" && typeof r?.net_pl === "number")
    .map((r) => ({ price: r.closing_price, pnl: r.net_pl }))
    .sort((a, b) => a.price - b.price);
}

const optionCode = (leg: Leg) => (leg.type === "call" ? "CE" : "PE");
const qty = (leg: Leg) => (leg.qty > 1 ? ` ${leg.qty}×` : "");

/** One label per strike, e.g. "Buy 1,180 CE" or "Sell 1,200 CE + PE". */
export function strikeMarkers(legs: Leg[]): StrikeMarker[] {
  const byStrike = new Map<number, Leg[]>();
  legs.forEach((leg) => byStrike.set(leg.strike, [...(byStrike.get(leg.strike) ?? []), leg]));
  return [...byStrike.entries()]
    .sort(([a], [b]) => a - b)
    .map(([strike, group]) => {
      const at = strike.toLocaleString("en-IN");
      const sameAction = group.every((l) => l.action === group[0].action && l.qty === group[0].qty);
      const label = sameAction
        ? `${group[0].action}${qty(group[0])} ${at} ${group.map(optionCode).join(" + ")}`
        : `${at} ${group.map((l) => `${l.action}${qty(l)} ${optionCode(l)}`).join(", ")}`;
      return { price: strike, label };
    });
}
