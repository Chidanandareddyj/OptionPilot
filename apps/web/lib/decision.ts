import type { View } from "./analysis";

type MarketData = { ltp?: number; bid_price?: number; ask_price?: number; oi?: number };
type ChainSide = { instrument_key: string; market_data?: MarketData; option_greeks?: { iv?: number } };
export type Chain = {
  data: { strike_price: number; underlying_spot_price: number; call_options?: ChainSide; put_options?: ChainSide }[];
};

export type Leg = { type: "CE" | "PE"; strike: number; qty: number; instrument_key: string; premium: number };
type LegSpec = [type: "CE" | "PE", qty: number, strikeField: string, keyField: string];

const STRATEGIES: Record<string, { views: View[]; legs: LegSpec[] }> = {
  long_straddle: { views: ["volatile"], legs: [["CE", 1, "strike_price", "call_instrument_key"], ["PE", 1, "strike_price", "put_instrument_key"]] },
  short_straddle: { views: ["neutral"], legs: [["CE", -1, "strike_price", "call_instrument_key"], ["PE", -1, "strike_price", "put_instrument_key"]] },
  long_strangle: { views: ["volatile"], legs: [["CE", 1, "call_strike_price", "call_instrument_key"], ["PE", 1, "put_strike_price", "put_instrument_key"]] },
  short_strangle: { views: ["neutral"], legs: [["CE", -1, "call_strike_price", "call_instrument_key"], ["PE", -1, "put_strike_price", "put_instrument_key"]] },
  bull_call_spread: { views: ["bullish"], legs: [["CE", 1, "lower_strike", "lower_call_instrument_key"], ["CE", -1, "higher_strike", "higher_call_instrument_key"]] },
  bear_call_spread: { views: ["bearish"], legs: [["CE", -1, "short_call_strike", "short_call_instrument_key"], ["CE", 1, "long_call_strike", "long_call_instrument_key"]] },
  bull_put_spread: { views: ["bullish"], legs: [["PE", -1, "higher_strike", "higher_put_instrument_key"], ["PE", 1, "lower_strike", "lower_put_instrument_key"]] },
  bear_put_spread: { views: ["bearish"], legs: [["PE", 1, "long_put_strike", "long_put_instrument_key"], ["PE", -1, "short_put_strike", "short_put_instrument_key"]] },
  call_butterfly: { views: ["neutral"], legs: [["CE", 1, "lower_strike", "lower_call_instrument_key"], ["CE", -2, "middle_strike", "middle_call_instrument_key"], ["CE", 1, "upper_strike", "upper_call_instrument_key"]] },
  put_butterfly: { views: ["neutral"], legs: [["PE", 1, "lower_strike", "lower_put_instrument_key"], ["PE", -2, "middle_strike", "middle_put_instrument_key"], ["PE", 1, "upper_strike", "upper_put_instrument_key"]] },
  call_condor: { views: ["neutral"], legs: [["CE", 1, "lower_strike", "lower_call_instrument_key"], ["CE", -1, "lower_middle_strike", "lower_middle_call_instrument_key"], ["CE", -1, "upper_middle_strike", "upper_middle_call_instrument_key"], ["CE", 1, "upper_strike", "upper_call_instrument_key"]] },
  put_condor: { views: ["neutral"], legs: [["PE", 1, "lower_strike", "lower_put_instrument_key"], ["PE", -1, "lower_middle_strike", "lower_middle_put_instrument_key"], ["PE", -1, "upper_middle_strike", "upper_middle_put_instrument_key"], ["PE", 1, "upper_strike", "upper_put_instrument_key"]] },
};

// ponytail: fixed liquidity floor (Upstox oi is in shares); tune per underlying if it rejects thin-but-tradeable names.
const MIN_OI_LOTS = 10;
const YEAR_MS = 365 * 864e5;

const round = (value: number) => Math.round(value * 100) / 100;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const pct = (value: number) => `${Math.round(value * 100)}%`;
const rupees = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

export function expiryMsLeft(expiry_date: string, now = Date.now()) {
  return Date.parse(`${expiry_date}T15:30:00+05:30`) - now;
}

export function payoff(legs: Leg[], price: number) {
  return legs.reduce(
    (pl, leg) => pl + leg.qty * (Math.max(leg.type === "CE" ? price - leg.strike : leg.strike - price, 0) - leg.premium),
    0,
  );
}

// Abramowitz-Stegun 7.1.26, |error| < 1.5e-7.
function normCdf(z: number) {
  const t = 1 / (1 + (0.3275911 * Math.abs(z)) / Math.SQRT2);
  const erf = 1 - t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp((-z * z) / 2);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

// ponytail: lognormal with one flat ATM vol ignores skew, and 1-point steps get coarse for low-priced underlyings.
export function analyzeLegs(legs: Leg[], spot: number, vol: number, years: number) {
  const sd = vol * Math.sqrt(years);
  const strikes = legs.map((leg) => leg.strike);
  const lo = Math.max(1, Math.floor(Math.min(spot * Math.exp(-4 * sd), ...strikes)));
  const hi = Math.ceil(Math.max(spot * Math.exp(4 * sd), ...strikes));
  const cdf = (price: number) => normCdf((Math.log(price / spot) + (sd * sd) / 2) / sd);

  let ev = 0;
  let pop = 0;
  let prev = 0;
  const breakevens: number[] = [];
  for (let price = lo; price <= hi; price++) {
    const pl = payoff(legs, price);
    const mass = (price === hi ? 1 : cdf(price + 0.5)) - (price === lo ? 0 : cdf(price - 0.5));
    ev += mass * pl;
    if (pl > 0) pop += mass;
    if (price > lo && prev > 0 !== pl > 0) breakevens.push(round(price - 1 + prev / (prev - pl)));
    prev = pl;
  }

  // Payoff is piecewise linear with kinks at strikes, so extremes sit at 0, a strike, or infinity.
  const callQty = legs.reduce((sum, leg) => sum + (leg.type === "CE" ? leg.qty : 0), 0);
  const kinks = [0, ...strikes].map((price) => payoff(legs, price));
  const undefinedRisk = callQty < 0;
  const twoSigma = [spot * Math.exp(-2 * sd), spot * Math.exp(2 * sd)].map((price) => payoff(legs, price));

  return {
    ev,
    pop,
    maxProfit: callQty > 0 ? null : Math.max(...kinks),
    maxLoss: -Math.min(...(undefinedRisk ? twoSigma : kinks)),
    breakevens,
    undefinedRisk,
  };
}

export function realizedVol(closesNewestFirst: number[]) {
  const closes = closesNewestFirst.slice(0, 31);
  const returns = closes.slice(1).map((close, i) => Math.log(closes[i] / close));
  if (returns.length < 10) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance * 252);
}

export function scoreStrategies({
  result,
  chain,
  lotSize,
  closes,
  view,
  maxLoss,
  now = Date.now(),
}: {
  result: Record<string, unknown>;
  chain: Chain;
  lotSize: number;
  closes: number[];
  view: View;
  maxLoss: number;
  now?: number;
}) {
  if (!chain.data.length) throw new Error("No option chain data found");
  const quotes = new Map<string, MarketData>();
  for (const row of chain.data) {
    for (const side of [row.call_options, row.put_options]) {
      if (side) quotes.set(side.instrument_key, side.market_data ?? {});
    }
  }

  const spot = chain.data[0].underlying_spot_price;
  const atm = chain.data.reduce((a, b) => (Math.abs(b.strike_price - spot) < Math.abs(a.strike_price - spot) ? b : a));
  const atmIvs = [atm.call_options, atm.put_options].map((side) => side?.option_greeks?.iv ?? 0).filter((iv) => iv > 0);
  const rv = realizedVol(closes);
  // Upstox v2 chain reports iv in percent (observed 23.99 for a ~24% ATM vol).
  const iv = atmIvs.length ? atmIvs.reduce((a, b) => a + b, 0) / atmIvs.length / 100 : rv;
  if (!iv) throw new Error("No implied or realized volatility available");
  const expiry_date = String(result.expiry_date);
  const years = expiryMsLeft(expiry_date, now) / YEAR_MS;

  const strategies = Object.entries(STRATEGIES).map(([key, spec]) => {
    const stored = result[key] as Record<string, unknown> | undefined;
    if (!stored) return { key, viable: false, quant: 0, reasons: ["missing from analysis"], metrics: null };

    const reasons: string[] = [];
    let viable = true;
    const legs: Leg[] = spec.legs.map(([type, qty, strikeField, keyField]) => {
      const strike = Number(stored[strikeField]);
      const instrument_key = String(stored[keyField]);
      const quote = quotes.get(instrument_key);
      const bid = quote?.bid_price ?? 0;
      const ask = quote?.ask_price ?? 0;
      const oi = quote?.oi ?? 0;
      const liquid = bid > 0 && ask > 0 && oi >= MIN_OI_LOTS * lotSize;
      if (!quote) reasons.push(`${type} ${strike} not in current chain`);
      else if (!liquid) reasons.push(`${type} ${strike} illiquid (bid ${bid}, ask ${ask}, oi ${oi})`);
      if (!liquid) viable = false;
      return { type, strike, qty, instrument_key, premium: liquid ? (bid + ask) / 2 : (quote?.ltp ?? 0) };
    });

    const m = analyzeLegs(legs, spot, iv, years);
    const netPremium = legs.reduce((sum, leg) => sum + leg.qty * leg.premium, 0);
    const seller = netPremium < 0;
    const fits = spec.views.includes(view);
    const lossPerLot = m.maxLoss * lotSize;
    const rewardRisk = m.maxProfit !== null && m.maxLoss > 0 ? m.maxProfit / m.maxLoss : null;
    const volEdge = rv ? clamp(iv / rv - 1, -0.5, 0.5) * (seller ? 1 : -1) : 0;

    if (lossPerLot > maxLoss) {
      viable = false;
      reasons.push(`max loss ${rupees(lossPerLot)}/lot exceeds budget ${rupees(maxLoss)}`);
    }
    reasons.push(
      `POP ${pct(m.pop)}`,
      `EV ${rupees(m.ev * lotSize)}/lot`,
      `max loss ${rupees(lossPerLot)}/lot${m.undefinedRisk ? " at 2-sigma move (undefined risk)" : ""}`,
      m.maxProfit === null ? "unlimited upside" : `max profit ${rupees(m.maxProfit * lotSize)}/lot`,
      fits ? `fits ${view} view` : `does not fit ${view} view (suits ${spec.views.join("/")})`,
      rv
        ? `IV ${pct(iv)} vs 30d RV ${pct(rv)} ${volEdge >= 0 ? "favors" : "works against"} this ${seller ? "credit" : "debit"} trade`
        : "realized vol unavailable",
    );

    // ponytail: hand-tuned weights; calibrate against realized trade outcomes once there is history.
    const quant = clamp(
      50 +
        30 * (m.pop - 0.5) +
        20 * clamp(m.maxLoss > 0 ? m.ev / m.maxLoss : 0, -1, 1) +
        10 * (rewardRisk === null ? (m.maxProfit === null ? 1 : 0) : clamp(Math.log(rewardRisk), -1, 1)) +
        20 * volEdge +
        (fits ? 15 : -40) -
        (m.undefinedRisk ? 10 : 0),
      0,
      100,
    );

    return {
      key,
      viable,
      quant,
      reasons,
      metrics: {
        legs: legs.map((leg) => ({ ...leg, premium: round(leg.premium) })),
        net_premium: round(netPremium),
        lot_size: lotSize,
        pop: round(m.pop),
        ev_per_lot: round(m.ev * lotSize),
        max_profit_per_lot: m.maxProfit === null ? null : round(m.maxProfit * lotSize),
        max_loss_per_lot: round(lossPerLot),
        reward_risk: rewardRisk === null ? null : round(rewardRisk),
        breakevens: m.breakevens,
        undefined_risk: m.undefinedRisk,
        quant_score: round(quant),
      },
    };
  });

  return {
    context: {
      underlying_key: result.underlying_key,
      expiry_date,
      spot,
      days_to_expiry: round(years * 365),
      atm_iv: round(iv),
      realized_vol_30d: rv === null ? null : round(rv),
      iv_rv_ratio: rv ? round(iv / rv) : null,
      lot_size: lotSize,
      view,
      max_loss_budget: maxLoss,
    },
    strategies,
  };
}

export function rankDecision(
  scored: ReturnType<typeof scoreStrategies>,
  llm: { viable: Record<string, number>; best: string; confidence: number | null } | null,
) {
  const strategies = scored.strategies
    .map(({ quant, ...strategy }) => {
      const p = llm?.viable[strategy.key];
      // ponytail: 60/40 quant/model blend is a guess; revisit once model calls can be scored against outcomes.
      const score = p === undefined ? quant : 0.6 * quant + 0.4 * 100 * p;
      return {
        ...strategy,
        score: round(score),
        reasons: p === undefined ? strategy.reasons : [...strategy.reasons, `model viability ${pct(p)}`],
      };
    })
    .sort((a, b) => Number(b.viable) - Number(a.viable) || b.score - a.score);

  const pick = llm && strategies.find((s) => s.viable && s.key === llm.best);
  const best = pick
    ? { key: pick.key, source: "llm" as const }
    : strategies[0]?.viable
      ? { key: strategies[0].key, source: "quant" as const }
      : null;

  return {
    ...scored.context,
    best,
    llm: llm ? ("ok" as const) : ("unavailable" as const),
    llm_best: llm ? { choice: llm.best, confidence: llm.confidence } : null,
    strategies,
  };
}
