// Pure helpers for the live "all derivatives" board: turn a relay price slice into the
// option-chain shape the strategy calculators already take, normalise their results into
// board metrics, and apply the sort / investment filters.

/** Static per-company data the relay sends once (`universe` event). */
export type Company = { k: string; s: string; n: string; e: string; l: number; strikes: number[] };
/** Live slice (`tick` event): spot plus [strike, ceLtp, ceLtt, peLtp, peLtt] for strikes near ATM. */
export type LiveRow = { k: string; sp: number; w: [number, number, number, number, number][] };

type Leg = { instrument_key: string; market_data: { ltp: number } };
export type Chain = {
  data: { strike_price: number; underlying_spot_price: number; call_options: Leg; put_options: Leg }[];
};
export type Calculator = (chain: Chain, recordsEachSide?: number) => Record<string, unknown>;

/** A leg with no trade for this long (while the market is open) marks the row stale. */
export const STALE_AFTER_MS = 15 * 60_000;

export type Evaluation = {
  k: string;
  symbol: string;
  name: string;
  expiry: string;
  lot: number;
  spot: number;
  /** Per lot, rupees. null = unlimited. */
  maxProfit: number | null;
  maxLoss: number | null;
  /** Capital at risk = max loss per lot. null = unlimited. */
  investment: number | null;
  roi: number | null;
  breakevens: number[];
  beDistancePct: number | null;
  /** The contracts the strategy trades, in the order the calculator names them (e.g. "980CE", "1000CE"). */
  legs: string[];
  /** Why the row is stale (e.g. "1210CE"), else null. */
  stale: string | null;
  payoff: Record<string, unknown>[];
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Synthetic option chain: every strike of the expiry, with live prices only inside the relay window. */
export function buildChain(company: Company, row: LiveRow) {
  const live = new Map(row.w.map((w) => [w[0], w]));
  const legs = new Map<string, { ltp: number; ltt: number }>();
  const data = company.strikes.map((strike) => {
    const w = live.get(strike);
    const leg = (side: "CE" | "PE", ltp = 0, ltt = 0): Leg => {
      const instrument_key = `${strike}${side}`;
      legs.set(instrument_key, { ltp, ltt });
      return { instrument_key, market_data: { ltp } };
    };
    return {
      strike_price: strike,
      underlying_spot_price: row.sp,
      call_options: leg("CE", w?.[1], w?.[2]),
      put_options: leg("PE", w?.[3], w?.[4]),
    };
  });
  return { chain: { data } as Chain, legs };
}

/** Run one strategy for one company. Returns null when the strategy cannot be built (strategy threw). */
export function evaluate(
  strategy: string,
  calc: Calculator,
  company: Company,
  row: LiveRow,
  ctx: { now: number; marketOpen: boolean },
): Evaluation | null {
  const { chain, legs } = buildChain(company, row);
  let r: Record<string, unknown>;
  try {
    r = calc(chain);
  } catch {
    return null;
  }

  // Straddles/strangles only return total_premium; the rest return max_profit/max_loss.
  let profit: number | null;
  let loss: number | null;
  if (strategy === "long_straddle" || strategy === "long_strangle") {
    profit = null;
    loss = num(r.total_premium);
  } else if (strategy.startsWith("short_")) {
    profit = num(r.total_premium);
    loss = null;
  } else {
    profit = num(r.max_profit);
    loss = num(r.max_loss);
  }
  const perLot = (v: number | null) => (v == null ? null : Math.round(v * company.l * 100) / 100);

  let stale: string | null = null;
  const legIds: string[] = [];
  for (const [field, id] of Object.entries(r)) {
    if (!field.endsWith("_instrument_key") || typeof id !== "string") continue;
    legIds.push(id);
    const leg = legs.get(id);
    if (stale === null && (!leg || leg.ltp <= 0 || (ctx.marketOpen && ctx.now - leg.ltt > STALE_AFTER_MS))) stale = id;
  }

  const breakevens = ["breakeven", "lower_breakeven", "upper_breakeven"].map((f) => num(r[f])).filter((v): v is number => v != null);
  const maxProfit = perLot(profit);
  const maxLoss = perLot(loss);
  return {
    k: company.k,
    symbol: company.s,
    name: company.n,
    expiry: company.e,
    lot: company.l,
    spot: row.sp,
    maxProfit,
    maxLoss,
    investment: maxLoss,
    roi: maxProfit != null && maxLoss != null && maxLoss > 0 ? maxProfit / maxLoss : null,
    breakevens,
    beDistancePct: breakevens.length ? Math.min(...breakevens.map((b) => (Math.abs(b - row.sp) / row.sp) * 100)) : null,
    legs: legIds,
    stale,
    payoff: Array.isArray(r.payoff_table) ? (r.payoff_table as Record<string, unknown>[]) : [],
  };
}

export type SortKey = "symbol" | "maxProfit" | "maxLoss" | "investment" | "roi" | "beDistancePct";
export type View = {
  investment: "all" | "low" | "high";
  min: number | null;
  max: number | null;
  hideStale: boolean;
  search: string;
  sort: SortKey;
  dir: "asc" | "desc";
};

// Unlimited profit/loss sorts as the largest value; a missing roi sorts as the smallest.
const sortValue = (e: Evaluation, key: Exclude<SortKey, "symbol">) => {
  const v = e[key];
  if (v != null) return v;
  return key === "roi" ? -Infinity : Infinity;
};

export function applyView(rows: Evaluation[], v: View): Evaluation[] {
  const q = v.search.trim().toUpperCase();
  let out = rows.filter((r) => (!v.hideStale || !r.stale) && (!q || r.symbol.toUpperCase().includes(q)));

  if (v.investment !== "all") {
    // Median split over live rows with a finite investment; stale/unlimited rows are never Low or High.
    const inv = out.filter((r) => !r.stale && r.investment != null).map((r) => r.investment as number).sort((a, b) => a - b);
    const median = inv.length ? (inv[(inv.length - 1) >> 1] + inv[inv.length >> 1]) / 2 : 0;
    out = out.filter(
      (r) => !r.stale && r.investment != null && (v.investment === "low" ? r.investment <= median : r.investment > median),
    );
  }
  if (v.min != null || v.max != null) {
    out = out.filter((r) => r.investment != null && r.investment >= (v.min ?? 0) && r.investment <= (v.max ?? Infinity));
  }

  const sign = v.dir === "asc" ? 1 : -1;
  return out.sort((a, b) => {
    if (v.sort === "symbol") return sign * a.symbol.localeCompare(b.symbol);
    const x = sortValue(a, v.sort);
    const y = sortValue(b, v.sort);
    return x === y ? a.symbol.localeCompare(b.symbol) : x < y ? -sign : sign;
  });
}
