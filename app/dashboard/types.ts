export type SentimentCategory = "all" | "bullish" | "bearish" | "neutral" | "volatile";

export type PayoffRow = {
  closing_price: number;
  net_pl: number;
  [key: string]: number;
};

export type OptionLegInfo = {
  label: string;
  strike: number;
  type: "call" | "put";
  action: "Buy" | "Sell";
  premium?: number;
  instrumentKey?: string;
};

export type NormalizedStrategy = {
  key: string;
  name: string;
  category: "bullish" | "bearish" | "neutral" | "volatile";
  tagline: string;
  description: string;
  spotPrice: number;
  strikes: OptionLegInfo[];
  costOrCredit: {
    label: string;
    amount: number;
    kind: "debit" | "credit" | "neutral";
  };
  maxProfit: number | "Unlimited" | null;
  maxLoss: number | "Unlimited" | null;
  breakevens: number[];
  payoffTable: PayoffRow[];
  raw: Record<string, unknown>;
};

export type AnalysisApiResponse = {
  underlying_key?: string;
  expiry_date?: string;
  underlying_spot_price?: number;
  options?: PayoffRow[];
  [strategyKey: string]: unknown;
};

export const STRATEGY_DEFINITIONS: Record<
  string,
  {
    name: string;
    category: "bullish" | "bearish" | "neutral" | "volatile";
    tagline: string;
    description: string;
  }
> = {
  bull_call_spread: {
    name: "Bull Call Spread",
    category: "bullish",
    tagline: "Moderate upside with limited downside risk",
    description:
      "A vertical spread buying an in-the-money or at-the-money call and selling an out-of-the-money call to reduce upfront cost.",
  },
  bull_put_spread: {
    name: "Bull Put Spread",
    category: "bullish",
    tagline: "Credit spread capitalizing on neutral to bullish moves",
    description:
      "A credit spread selling a higher-strike put and buying a lower-strike put for downside protection while collecting premium.",
  },
  bear_call_spread: {
    name: "Bear Call Spread",
    category: "bearish",
    tagline: "Credit spread capitalizing on neutral to bearish moves",
    description:
      "A credit spread selling a lower-strike call and buying a higher-strike call for protection against sharp rallies.",
  },
  bear_put_spread: {
    name: "Bear Put Spread",
    category: "bearish",
    tagline: "Cost-effective bearish play with capped risk",
    description:
      "A debit spread buying a higher-strike put and selling a lower-strike put to lower the cost of purchasing put protection.",
  },
  long_straddle: {
    name: "Long Straddle",
    category: "volatile",
    tagline: "Profits from a major move in either direction",
    description:
      "Simultaneously buying an ATM call and an ATM put at the same strike and expiration to capture explosive volatility.",
  },
  short_straddle: {
    name: "Short Straddle",
    category: "neutral",
    tagline: "Harvests high premium in calm, sideways markets",
    description:
      "Simultaneously selling an ATM call and an ATM put, collecting maximum premium if the underlying finishes near the strike.",
  },
  long_strangle: {
    name: "Long Strangle",
    category: "volatile",
    tagline: "Lower-cost breakout strategy targeting huge moves",
    description:
      "Buying an OTM put and an OTM call. Cheaper than a straddle, requiring a larger price movement to achieve profitability.",
  },
  short_strangle: {
    name: "Short Strangle",
    category: "neutral",
    tagline: "Wider profit zone taking advantage of low volatility",
    description:
      "Selling an OTM put and an OTM call to collect upfront premium while allowing a wider range of price movement before losses.",
  },
  call_butterfly: {
    name: "Call Butterfly",
    category: "neutral",
    tagline: "Targeted sweet spot with low risk and high R:R",
    description:
      "Constructed using three strike prices with four call contracts (1 Long lower, 2 Short middle, 1 Long upper) targeting a pinpoint finish.",
  },
  put_butterfly: {
    name: "Put Butterfly",
    category: "neutral",
    tagline: "Low debit neutral play targeting the middle strike",
    description:
      "Constructed using three strike prices with four put contracts (1 Long lower, 2 Short middle, 1 Long upper) for limited risk.",
  },
  call_condor: {
    name: "Call Condor",
    category: "neutral",
    tagline: "Broad flat profit zone using four call strikes",
    description:
      "Uses four distinct strikes (Long low, Short lower-mid, Short upper-mid, Long upper) creating an extended plateau of maximum profit.",
  },
  put_condor: {
    name: "Put Condor",
    category: "neutral",
    tagline: "Wide neutral profit zone using four put strikes",
    description:
      "Four put strikes creating a wide range where maximum profit is attained if the asset closes within the inner strikes.",
  },
};

export function normalizeStrategy(
  key: string,
  raw: unknown,
  fallbackSpotPrice?: number
): NormalizedStrategy | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Record<string, unknown>;
  const meta = STRATEGY_DEFINITIONS[key] || {
    name: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    category: "neutral" as const,
    tagline: "Calculated option strategy",
    description: `Option structure calculated for ${key.replace(/_/g, " ")}.`,
  };

  const spotPrice =
    typeof data.spot_price === "number"
      ? data.spot_price
      : fallbackSpotPrice || 0;

  const payoffTable: PayoffRow[] = Array.isArray(data.payoff_table)
    ? (data.payoff_table as PayoffRow[])
    : [];

  // Extract legs
  const strikes: OptionLegInfo[] = [];

  // 1. Long / Short Straddle
  if ("strike_price" in data && typeof data.strike_price === "number") {
    const isShort = key.includes("short");
    strikes.push({
      label: "Call Leg",
      strike: data.strike_price,
      type: "call",
      action: isShort ? "Sell" : "Buy",
      premium: typeof data.call_premium === "number" ? data.call_premium : undefined,
      instrumentKey: typeof data.call_instrument_key === "string" ? data.call_instrument_key : undefined,
    });
    strikes.push({
      label: "Put Leg",
      strike: data.strike_price,
      type: "put",
      action: isShort ? "Sell" : "Buy",
      premium: typeof data.put_premium === "number" ? data.put_premium : undefined,
      instrumentKey: typeof data.put_instrument_key === "string" ? data.put_instrument_key : undefined,
    });
  }

  // 2. Long / Short Strangle
  if ("put_strike_price" in data && typeof data.put_strike_price === "number") {
    const isShort = key.includes("short");
    strikes.push({
      label: "Put Strike",
      strike: data.put_strike_price,
      type: "put",
      action: isShort ? "Sell" : "Buy",
      premium: typeof data.put_premium === "number" ? data.put_premium : undefined,
      instrumentKey: typeof data.put_instrument_key === "string" ? data.put_instrument_key : undefined,
    });
  }
  if ("call_strike_price" in data && typeof data.call_strike_price === "number") {
    const isShort = key.includes("short");
    strikes.push({
      label: "Call Strike",
      strike: data.call_strike_price,
      type: "call",
      action: isShort ? "Sell" : "Buy",
      premium: typeof data.call_premium === "number" ? data.call_premium : undefined,
      instrumentKey: typeof data.call_instrument_key === "string" ? data.call_instrument_key : undefined,
    });
  }

  // 3. Spreads with lower_strike and higher_strike
  if ("lower_strike" in data && typeof data.lower_strike === "number" && !("middle_strike" in data)) {
    if (key === "bull_call_spread") {
      strikes.push({
        label: "Long Lower Call",
        strike: data.lower_strike,
        type: "call",
        action: "Buy",
        premium: typeof data.lower_call_premium === "number" ? data.lower_call_premium : undefined,
        instrumentKey: typeof data.lower_call_instrument_key === "string" ? data.lower_call_instrument_key : undefined,
      });
      if (typeof data.higher_strike === "number") {
        strikes.push({
          label: "Short Higher Call",
          strike: data.higher_strike,
          type: "call",
          action: "Sell",
          premium: typeof data.higher_call_premium === "number" ? data.higher_call_premium : undefined,
          instrumentKey: typeof data.higher_call_instrument_key === "string" ? data.higher_call_instrument_key : undefined,
        });
      }
    } else if (key === "bull_put_spread") {
      strikes.push({
        label: "Long Lower Put",
        strike: data.lower_strike,
        type: "put",
        action: "Buy",
        premium: typeof data.lower_put_premium === "number" ? data.lower_put_premium : undefined,
        instrumentKey: typeof data.lower_put_instrument_key === "string" ? data.lower_put_instrument_key : undefined,
      });
      if (typeof data.higher_strike === "number") {
        strikes.push({
          label: "Short Higher Put",
          strike: data.higher_strike,
          type: "put",
          action: "Sell",
          premium: typeof data.higher_put_premium === "number" ? data.higher_put_premium : undefined,
          instrumentKey: typeof data.higher_put_instrument_key === "string" ? data.higher_put_instrument_key : undefined,
        });
      }
    } else if (key === "bear_put_spread") {
      if (typeof data.higher_strike === "number") {
        strikes.push({
          label: "Long Higher Put",
          strike: data.higher_strike,
          type: "put",
          action: "Buy",
          premium: typeof data.higher_put_premium === "number" ? data.higher_put_premium : undefined,
          instrumentKey: typeof data.higher_put_instrument_key === "string" ? data.higher_put_instrument_key : undefined,
        });
      }
      strikes.push({
        label: "Short Lower Put",
        strike: data.lower_strike,
        type: "put",
        action: "Sell",
        premium: typeof data.lower_put_premium === "number" ? data.lower_put_premium : undefined,
        instrumentKey: typeof data.lower_put_instrument_key === "string" ? data.lower_put_instrument_key : undefined,
      });
    }
  }

  // 4. Bear Call Spread (short_call_strike, long_call_strike)
  if ("short_call_strike" in data && typeof data.short_call_strike === "number") {
    strikes.push({
      label: "Short Lower Call",
      strike: data.short_call_strike,
      type: "call",
      action: "Sell",
      premium: typeof data.short_call_premium === "number" ? data.short_call_premium : undefined,
      instrumentKey: typeof data.short_call_instrument_key === "string" ? data.short_call_instrument_key : undefined,
    });
    if (typeof data.long_call_strike === "number") {
      strikes.push({
        label: "Long Higher Call",
        strike: data.long_call_strike,
        type: "call",
        action: "Buy",
        premium: typeof data.long_call_premium === "number" ? data.long_call_premium : undefined,
        instrumentKey: typeof data.long_call_instrument_key === "string" ? data.long_call_instrument_key : undefined,
      });
    }
  }

  // 5. Butterflies (lower, middle, upper)
  if ("middle_strike" in data && typeof data.middle_strike === "number") {
    const isPut = key.includes("put");
    const optType = isPut ? "put" : "call";
    if (typeof data.lower_strike === "number") {
      strikes.push({
        label: "Lower Strike (+1)",
        strike: data.lower_strike,
        type: optType,
        action: "Buy",
        premium: typeof data.lower_call_premium === "number" ? data.lower_call_premium : (data.lower_put_premium as number),
        instrumentKey: (data.lower_call_instrument_key || data.lower_put_instrument_key) as string,
      });
    }
    strikes.push({
      label: "Middle Strike (-2)",
      strike: data.middle_strike,
      type: optType,
      action: "Sell",
      premium: typeof data.middle_call_premium === "number" ? data.middle_call_premium : (data.middle_put_premium as number),
      instrumentKey: (data.middle_call_instrument_key || data.middle_put_instrument_key) as string,
    });
    if (typeof data.upper_strike === "number") {
      strikes.push({
        label: "Upper Strike (+1)",
        strike: data.upper_strike,
        type: optType,
        action: "Buy",
        premium: typeof data.upper_call_premium === "number" ? data.upper_call_premium : (data.upper_put_premium as number),
        instrumentKey: (data.upper_call_instrument_key || data.upper_put_instrument_key) as string,
      });
    }
  }

  // 6. Condors (strike_1, strike_2, strike_3, strike_4)
  if ("strike_1" in data && typeof data.strike_1 === "number") {
    const isPut = key.includes("put");
    const optType = isPut ? "put" : "call";
    strikes.push({ label: "Strike 1 (+1)", strike: data.strike_1, type: optType, action: "Buy" });
    if (typeof data.strike_2 === "number") strikes.push({ label: "Strike 2 (-1)", strike: data.strike_2, type: optType, action: "Sell" });
    if (typeof data.strike_3 === "number") strikes.push({ label: "Strike 3 (-1)", strike: data.strike_3, type: optType, action: "Sell" });
    if (typeof data.strike_4 === "number") strikes.push({ label: "Strike 4 (+1)", strike: data.strike_4, type: optType, action: "Buy" });
  }

  // Cost or credit calculation
  let costOrCredit: NormalizedStrategy["costOrCredit"] = {
    label: "Net Debit",
    amount: 0,
    kind: "debit",
  };

  if (typeof data.net_debit === "number") {
    costOrCredit = { label: "Net Debit", amount: data.net_debit, kind: "debit" };
  } else if (typeof data.net_credit === "number") {
    costOrCredit = { label: "Net Credit", amount: data.net_credit, kind: "credit" };
  } else if (typeof data.total_premium === "number") {
    const isShort = key.includes("short");
    costOrCredit = {
      label: isShort ? "Credit Received" : "Total Premium Paid",
      amount: data.total_premium,
      kind: isShort ? "credit" : "debit",
    };
  }

  // Max profit & loss
  let maxProfit: number | "Unlimited" | null = null;
  if (typeof data.max_profit === "number") {
    maxProfit = data.max_profit;
  } else if (key === "long_straddle" || key === "long_strangle") {
    maxProfit = "Unlimited";
  } else if (key === "short_straddle" || key === "short_strangle") {
    maxProfit = typeof data.total_premium === "number" ? data.total_premium : null;
  }

  let maxLoss: number | "Unlimited" | null = null;
  if (typeof data.max_loss === "number") {
    maxLoss = data.max_loss;
  } else if (key === "short_straddle" || key === "short_strangle") {
    maxLoss = "Unlimited";
  } else if (key === "long_straddle" || key === "long_strangle") {
    maxLoss = typeof data.total_premium === "number" ? data.total_premium : null;
  }

  // Breakevens
  const breakevens: number[] = [];
  const pushBe = (val: unknown) => {
    if (typeof val === "number" && !isNaN(val)) breakevens.push(val);
    else if (typeof val === "string" && val.trim() !== "" && !isNaN(Number(val))) {
      breakevens.push(Number(val));
    }
  };
  pushBe(data.breakeven);
  pushBe(data.lower_breakeven);
  pushBe(data.upper_breakeven);
  if (Array.isArray(data.breakevens)) {
    data.breakevens.forEach(pushBe);
  }

  return {
    key,
    name: meta.name,
    category: meta.category,
    tagline: meta.tagline,
    description: meta.description,
    spotPrice,
    strikes,
    costOrCredit,
    maxProfit,
    maxLoss,
    breakevens: Array.from(new Set(breakevens)).sort((a, b) => a - b),
    payoffTable,
    raw: data,
  };
}
