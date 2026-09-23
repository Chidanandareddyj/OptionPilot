export type Category = "bullish" | "bearish" | "neutral" | "volatile";

export type PayoffRow = {
  closing_price: number;
  net_pl: number;
  [key: string]: number;
};

export type Leg = {
  label: string;
  action: "Buy" | "Sell";
  type: "call" | "put";
  qty: number;
  strike: number;
  premium?: number;
  instrumentKey?: string;
};

export type Limit = number | "Unlimited" | null;

export type NormalizedStrategy = {
  key: string;
  name: string;
  category: Category;
  tagline: string;
  description: string;
  spotPrice: number;
  legs: Leg[];
  costOrCredit: { label: string; amount: number };
  maxProfit: Limit;
  maxLoss: Limit;
  breakevens: number[];
  payoffTable: PayoffRow[];
};

// [action, strike field, field prefix, qty]. The prefix locates `${prefix}_premium` and
// `${prefix}_instrument_key` in the calculator output and ends in the option type.
type LegSpec = ["Buy" | "Sell", string, string, number?];

type StrategyDef = {
  name: string;
  category: Category;
  tagline: string;
  description: string;
  legs: LegSpec[];
};

export const STRATEGY_DEFINITIONS: Record<string, StrategyDef> = {
  bull_call_spread: {
    name: "Bull Call Spread",
    category: "bullish",
    tagline: "Moderate upside with limited downside risk",
    description: "Buy a lower-strike call and sell a higher-strike call to cut the upfront cost.",
    legs: [["Buy", "lower_strike", "lower_call"], ["Sell", "higher_strike", "higher_call"]],
  },
  bull_put_spread: {
    name: "Bull Put Spread",
    category: "bullish",
    tagline: "Credit spread for neutral to bullish moves",
    description: "Sell a higher-strike put and buy a lower-strike put for protection, keeping the premium.",
    legs: [["Buy", "lower_strike", "lower_put"], ["Sell", "higher_strike", "higher_put"]],
  },
  bear_call_spread: {
    name: "Bear Call Spread",
    category: "bearish",
    tagline: "Credit spread for neutral to bearish moves",
    description: "Sell a lower-strike call and buy a higher-strike call to cap the loss on a sharp rally.",
    legs: [["Sell", "short_call_strike", "short_call"], ["Buy", "long_call_strike", "long_call"]],
  },
  bear_put_spread: {
    name: "Bear Put Spread",
    category: "bearish",
    tagline: "Cheaper bearish play with capped risk",
    description: "Buy a higher-strike put and sell a lower-strike put to lower the cost of the put.",
    legs: [["Buy", "long_put_strike", "long_put"], ["Sell", "short_put_strike", "short_put"]],
  },
  long_straddle: {
    name: "Long Straddle",
    category: "volatile",
    tagline: "Profits from a big move either way",
    description: "Buy an ATM call and an ATM put at the same strike to catch a large move in either direction.",
    legs: [["Buy", "strike_price", "call"], ["Buy", "strike_price", "put"]],
  },
  short_straddle: {
    name: "Short Straddle",
    category: "neutral",
    tagline: "Collects rich premium in a quiet market",
    description: "Sell an ATM call and an ATM put. Keeps the most premium if price finishes near the strike.",
    legs: [["Sell", "strike_price", "call"], ["Sell", "strike_price", "put"]],
  },
  long_strangle: {
    name: "Long Strangle",
    category: "volatile",
    tagline: "Cheaper breakout play that needs a bigger move",
    description: "Buy an OTM put and an OTM call. Costs less than a straddle but needs a larger move to pay off.",
    legs: [["Buy", "put_strike_price", "put"], ["Buy", "call_strike_price", "call"]],
  },
  short_strangle: {
    name: "Short Strangle",
    category: "neutral",
    tagline: "Wider profit zone in low volatility",
    description: "Sell an OTM put and an OTM call, giving price more room to move before losses start.",
    legs: [["Sell", "put_strike_price", "put"], ["Sell", "call_strike_price", "call"]],
  },
  call_butterfly: {
    name: "Call Butterfly",
    category: "neutral",
    tagline: "Low-cost bet on price pinning a strike",
    description: "Buy one lower call, sell two middle calls, buy one upper call. Pays most at the middle strike.",
    legs: [
      ["Buy", "lower_strike", "lower_call"],
      ["Sell", "middle_strike", "middle_call", 2],
      ["Buy", "upper_strike", "upper_call"],
    ],
  },
  put_butterfly: {
    name: "Put Butterfly",
    category: "neutral",
    tagline: "Low-debit neutral play on the middle strike",
    description: "Buy one lower put, sell two middle puts, buy one upper put. Pays most at the middle strike.",
    legs: [
      ["Buy", "lower_strike", "lower_put"],
      ["Sell", "middle_strike", "middle_put", 2],
      ["Buy", "upper_strike", "upper_put"],
    ],
  },
  call_condor: {
    name: "Call Condor",
    category: "neutral",
    tagline: "Flat profit zone across four call strikes",
    description: "Buy the outer calls and sell the two inner calls for a wide plateau of maximum profit.",
    legs: [
      ["Buy", "lower_strike", "lower_call"],
      ["Sell", "lower_middle_strike", "lower_middle_call"],
      ["Sell", "upper_middle_strike", "upper_middle_call"],
      ["Buy", "upper_strike", "upper_call"],
    ],
  },
  put_condor: {
    name: "Put Condor",
    category: "neutral",
    tagline: "Wide neutral zone across four put strikes",
    description: "Buy the outer puts and sell the two inner puts. Pays most if price closes between the inner strikes.",
    legs: [
      ["Buy", "lower_strike", "lower_put"],
      ["Sell", "lower_middle_strike", "lower_middle_put"],
      ["Sell", "upper_middle_strike", "upper_middle_put"],
      ["Buy", "upper_strike", "upper_put"],
    ],
  },
};

export const CATEGORY_BADGE: Record<Category, string> = {
  bullish: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  bearish: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  neutral: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  volatile: "border-indigo-400/30 bg-indigo-500/10 text-indigo-300",
};

export const inr = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const formatLimit = (v: Limit) => (typeof v === "number" ? inr(v) : v ?? "—");

export function keyMetrics(s: NormalizedStrategy) {
  return [
    { label: s.costOrCredit.label, value: inr(s.costOrCredit.amount), tone: "text-white" },
    { label: "Max profit", value: formatLimit(s.maxProfit), tone: "text-emerald-400" },
    { label: "Max loss", value: formatLimit(s.maxLoss), tone: "text-rose-400" },
    {
      label: s.breakevens.length > 1 ? "Breakevens" : "Breakeven",
      value: s.breakevens.map(inr).join(" / ") || "—",
      tone: "text-amber-300",
    },
  ];
}

const num = (v: unknown) => (typeof v === "number" ? v : undefined);

export function normalizeStrategy(key: string, raw: unknown, fallbackSpot = 0): NormalizedStrategy | null {
  const def = STRATEGY_DEFINITIONS[key];
  if (!def || !raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;

  const legs: Leg[] = def.legs.flatMap(([action, strikeField, prefix, qty = 1]) => {
    const strike = num(data[strikeField]);
    if (strike === undefined) return [];
    const instrumentKey = data[`${prefix}_instrument_key`];
    return {
      label: prefix.replace(/_/g, " "),
      action,
      type: prefix.endsWith("put") ? "put" : "call",
      qty,
      strike,
      premium: num(data[`${prefix}_premium`]),
      instrumentKey: typeof instrumentKey === "string" ? instrumentKey : undefined,
    };
  });

  const isShort = key.startsWith("short_");
  const premium = num(data.total_premium);
  const costOrCredit =
    num(data.net_credit) !== undefined
      ? { label: "Net credit", amount: num(data.net_credit)! }
      : { label: isShort ? "Credit received" : "Net debit", amount: num(data.net_debit) ?? premium ?? 0 };

  // Straddles and strangles don't report max P&L; the premium bounds one side, the other is open.
  const unbounded = premium !== undefined && num(data.max_profit) === undefined;
  const maxProfit = num(data.max_profit) ?? (unbounded ? (isShort ? premium : "Unlimited") : null);
  const maxLoss = num(data.max_loss) ?? (unbounded ? (isShort ? "Unlimited" : premium) : null);

  const breakevens = [data.breakeven, data.lower_breakeven, data.upper_breakeven]
    .map(num)
    .filter((b) => b !== undefined)
    .sort((a, b) => a - b);

  return {
    key,
    ...def,
    spotPrice: num(data.spot_price) ?? fallbackSpot,
    legs,
    costOrCredit,
    maxProfit,
    maxLoss,
    breakevens,
    payoffTable: Array.isArray(data.payoff_table) ? data.payoff_table : [],
  };
}
