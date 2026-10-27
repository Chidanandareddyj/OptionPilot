import {
  BOARD_CALCULATORS,
  buildChain,
  evaluate,
  normalizeStrategy,
  price,
  signedInr,
  type BoardFeed,
  type Company,
  type Evaluation,
  type NormalizedStrategy,
} from "@optionpilot/shared";
import { isMarketOpen } from "@optionpilot/shared";

export type ContractPayoffRow = { price: number; pnl: number; nearest: boolean };

export type ContractDetail = {
  evaluation: Evaluation;
  /** The strategy in the shape the payoff chart reads. */
  model: NormalizedStrategy;
  rows: ContractPayoffRow[];
  stats: { label: string; value: string; tone?: "profit" | "loss"; strong?: boolean }[];
};

const limit = (value: number | null, sign: 1 | -1) => (value == null ? "Unlimited" : signedInr(sign * Math.abs(value)));

/** Net profit or loss per lot at each closing price of the calculator's table. The row nearest spot is marked. */
export function payoffRows(evaluation: Evaluation): ContractPayoffRow[] {
  const rows = evaluation.payoff
    .map((r) => ({ price: Number(r.closing_price), pnl: Number(r.net_pl) * evaluation.lot }))
    .filter((r) => Number.isFinite(r.price) && Number.isFinite(r.pnl));
  let nearest = -1;
  rows.forEach((r, i) => {
    if (nearest < 0 || Math.abs(r.price - evaluation.spot) < Math.abs(rows[nearest].price - evaluation.spot)) nearest = i;
  });
  return rows.map((r, i) => ({ ...r, pnl: Math.round(r.pnl * 100) / 100, nearest: i === nearest }));
}

/** Everything the contract sheet shows, for one company and strategy. Null when the strategy cannot be built from the prices held. */
export function contractDetail(company: Company, feed: BoardFeed, strategy: string): ContractDetail | null {
  const calc = BOARD_CALCULATORS[strategy];
  const row = feed.rows.get(company.k);
  if (!calc || !row) return null;
  const evaluation = evaluate(strategy, calc, company, row, { now: feed.now, marketOpen: isMarketOpen(feed) });
  if (!evaluation) return null;
  let raw: Record<string, unknown>;
  try {
    raw = calc(buildChain(company, row).chain);
  } catch {
    return null;
  }
  const model = normalizeStrategy(strategy, raw, row.sp, company.l);
  if (!model) return null;
  return {
    evaluation,
    model,
    rows: payoffRows(evaluation),
    stats: [
      { label: "Max profit per lot", value: limit(evaluation.maxProfit, 1), tone: "profit" },
      { label: "Max loss per lot", value: limit(evaluation.maxLoss, -1), tone: "loss" },
      { label: "Investment", value: evaluation.investment == null ? "—" : `₹${price(evaluation.investment)}`, strong: true },
      { label: "Profit to risk", value: evaluation.roi == null ? "—" : evaluation.roi.toFixed(2) },
      { label: "Breakeven away", value: evaluation.beDistancePct == null ? "—" : `${evaluation.beDistancePct.toFixed(2)}%` },
      { label: "Breakeven", value: evaluation.breakevens.length ? evaluation.breakevens.map((b) => price(b, 2)).join(" / ") : "—" },
    ],
  };
}
