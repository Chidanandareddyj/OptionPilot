import {
  STRATEGY_DEFINITIONS,
  normalizeStrategy,
  parseStoredDecision,
  payoffPoints,
  type Category,
  type Leg,
  type NormalizedStrategy,
  type PayoffPoint,
} from "@optionpilot/shared";
import { capitalize, formatExpiry, money, signed } from "./format";

type Payload = Record<string, unknown>;

const asPayload = (result: unknown): Payload => (result && typeof result === "object" ? (result as Payload) : {});
const numberOf = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);

export type AnalysisHeader = {
  symbol: string;
  spot: number;
  atm: number | null;
  expiry: string | null;
  lotSize: number;
};

export function analysisHeader(company: string, result: unknown): AnalysisHeader {
  const data = asPayload(result);
  const straddle = (key: string) => numberOf((data[key] as { strike_price?: unknown } | undefined)?.strike_price);
  return {
    symbol: company.trim().toUpperCase(),
    spot: numberOf(data.underlying_spot_price) ?? 0,
    atm: numberOf(data.atm_strike) ?? straddle("long_straddle") ?? straddle("short_straddle") ?? null,
    expiry: typeof data.expiry_date === "string" ? formatExpiry(data.expiry_date) : null,
    lotSize: Math.max(1, numberOf(data.lot_size) ?? 1),
  };
}

/** Every strategy the calculator returned for the analysis, scaled to one lot. */
export function strategiesOf(result: unknown): NormalizedStrategy[] {
  const data = asPayload(result);
  const { spot, lotSize } = analysisHeader("", result);
  return Object.keys(STRATEGY_DEFINITIONS).flatMap((key) => normalizeStrategy(key, data[key], spot, lotSize) ?? []);
}

/** The strategy to open first: the saved recommendation when there is one, else the first. */
export function initialStrategyKey(strategies: NormalizedStrategy[], decision: unknown): string | null {
  const stored = parseStoredDecision(decision);
  const best = stored.mode === "single" ? (stored.single as { best?: { key?: unknown } } | null)?.best?.key : undefined;
  if (typeof best === "string" && strategies.some((s) => s.key === best)) return best;
  return strategies[0]?.key ?? null;
}

export const VIEW_LABEL: Record<Category, string> = {
  bullish: "Bullish",
  bearish: "Bearish",
  neutral: "Neutral",
  volatile: "Volatile",
};

export const VIEW_ORDER: Category[] = ["bullish", "bearish", "neutral", "volatile"];

/** Strategy counts by view, for the Browse by view tiles. Derived from the shared definitions. */
export function strategyCountsByView(): Record<Category, number> {
  const counts: Record<Category, number> = { bullish: 0, bearish: 0, neutral: 0, volatile: 0 };
  Object.values(STRATEGY_DEFINITIONS).forEach((def) => (counts[def.category] += 1));
  return counts;
}

/** What one rupee of risk returns at the best case: "1 : 1.33". Null when either side is open. */
export function riskToReward(strategy: NormalizedStrategy): string | null {
  const { maxProfit, maxLoss } = strategy;
  if (typeof maxProfit !== "number" || typeof maxLoss !== "number" || maxLoss === 0) return null;
  const ratio = Math.abs(maxProfit) / Math.abs(maxLoss);
  return `1 : ${ratio.toFixed(2)}`;
}

export type StatTone = "profit" | "loss" | undefined;
export type Stat = { label: string; value: string; tone: StatTone };

const limitStat = (label: string, limit: NormalizedStrategy["maxProfit"], tone: StatTone, sign: 1 | -1): Stat => ({
  label,
  tone,
  value: typeof limit === "number" ? signed(sign * Math.abs(limit)) : (limit ?? "—"),
});

/** The horizontal strip under the payoff chart. */
export function strategyStats(strategy: NormalizedStrategy, spot: number): Stat[] {
  const lot = strategy.lotSize > 1 ? `, ${strategy.lotSize.toLocaleString("en-IN")} lot` : "";
  return [
    limitStat("Max profit", strategy.maxProfit, "profit", 1),
    limitStat("Max loss", strategy.maxLoss, "loss", -1),
    {
      label: strategy.breakevens.length > 1 ? "Breakevens" : "Breakeven",
      value: strategy.breakevens.map((b) => money(b)).join(" / ") || "—",
      tone: undefined,
    },
    { label: "Risk to reward", value: riskToReward(strategy) ?? "—", tone: undefined },
    { label: `${strategy.costOrCredit.label}${lot}`, value: money(strategy.costOrCredit.amount), tone: undefined },
    { label: "Spot", value: money(spot), tone: undefined },
  ];
}

/**
 * The amount ROI is measured against: the debit paid, else the worst loss. Null when neither is a
 * known positive number.
 */
export function roiBase(strategy: NormalizedStrategy): number | null {
  if (strategy.costOrCredit.label.toLowerCase().includes("debit") && strategy.costOrCredit.amount > 0) {
    return strategy.costOrCredit.amount;
  }
  return typeof strategy.maxLoss === "number" && strategy.maxLoss > 0 ? strategy.maxLoss : null;
}

export type PayoffTableRow = { price: number; pnl: number; roi: number | null; isSpot: boolean };

export function payoffTableRows(strategy: NormalizedStrategy, spot: number): PayoffTableRow[] {
  const points = payoffPoints(strategy.payoffTable);
  const base = roiBase(strategy);
  const nearest = points.reduce<number | null>(
    (best, p, i) => (best === null || Math.abs(p.price - spot) < Math.abs(points[best].price - spot) ? i : best),
    null,
  );
  return points.map((p, i) => ({
    price: p.price,
    pnl: p.pnl,
    roi: base ? (p.pnl / base) * 100 : null,
    isSpot: i === nearest && Math.abs(p.price - spot) <= (points[1]?.price - points[0]?.price || Infinity) / 2,
  }));
}

export type LegCard = {
  title: string;
  action: Leg["action"];
  strike: string;
  premium: string;
  quantity: string;
  cashFlow: number;
};

/**
 * The calculators name the legs of a bear spread "long put" and "short put". The design calls them
 * by position, like the bull spreads: "Higher put" and "Lower put".
 */
function legTitle(leg: Leg, legs: Leg[]): string {
  const label = capitalize(leg.label);
  const [first, second] = legs;
  const pair = legs.length === 2 && first.type === second.type && first.strike !== second.strike;
  if (!pair || !/^(long|short) /.test(leg.label)) return label;
  const higher = leg.strike === Math.max(first.strike, second.strike);
  return `${higher ? "Higher" : "Lower"} ${leg.type}`;
}

/** One card per leg. Cash flow is what the leg moves in the account: buying pays, selling receives. */
export function legCards(strategy: NormalizedStrategy): LegCard[] {
  return strategy.legs.map((leg) => {
    const units = leg.qty * strategy.lotSize;
    const premium = leg.premium ?? 0;
    return {
      title: legTitle(leg, strategy.legs),
      action: leg.action,
      strike: `${leg.strike.toLocaleString("en-IN")} ${leg.type === "call" ? "CE" : "PE"}`,
      premium: `₹${money(premium)}`,
      quantity: units.toLocaleString("en-IN"),
      cashFlow: (leg.action === "Buy" ? -1 : 1) * premium * units,
    };
  });
}

export const netCashFlow = (cards: LegCard[]) => cards.reduce((sum, card) => sum + card.cashFlow, 0);

/** The default x window of the chart: the strikes with room either side, inside the table. */
export function chartWindow(points: PayoffPoint[], strikes: number[]): [number, number] {
  const first = points[0]?.price ?? 0;
  const last = points.at(-1)?.price ?? 1;
  if (strikes.length === 0) return [first, last];
  const low = Math.min(...strikes);
  const high = Math.max(...strikes);
  const step = points.length > 1 ? (last - first) / (points.length - 1) : 1;
  const pad = Math.max((high - low) * 1.5, step * 3);
  return [Math.max(first, low - pad), Math.min(last, high + pad)];
}

/** "Bullish · Bull Call Spread" is a view and a strategy. Other tags, like "12 strategies", are only a name. */
export function parseTag(tag: string): { view: Category | null; name: string } {
  const [head, ...rest] = tag.split(" · ");
  const view = VIEW_ORDER.find((candidate) => candidate === head.trim().toLowerCase());
  return view && rest.length > 0 ? { view, name: rest.join(" · ") } : { view: null, name: tag };
}
