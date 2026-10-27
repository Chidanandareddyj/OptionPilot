// The live board's state, kept free of any transport so the web board and the mobile app share it:
// merge relay ticks into a feed, evaluate every company for one strategy, and word the status line.
import { calculateBearCallSpread } from "./strategies/BearCallSpread";
import { calculateBearPutSpread } from "./strategies/BearPutSpread";
import { calculateBullCallSpread } from "./strategies/BullCallSpread";
import { calculateBullPutSpread } from "./strategies/BullPutSpread";
import { calculateCallButterfly } from "./strategies/CallButterfly";
import { calculateCallCondor } from "./strategies/CallCondor";
import { calculateLongStraddle } from "./strategies/LongStraddle";
import { calculateLongStrangle } from "./strategies/LongStrangle";
import { calculatePutButterfly } from "./strategies/PutButterfly";
import { calculatePutCondor } from "./strategies/PutCondor";
import { calculateShortStraddle } from "./strategies/ShortStraddle";
import { calculateShortStrangle } from "./strategies/ShortStrangle";
import { applyView, evaluate, type Calculator, type Company, type Evaluation, type LiveRow, type View } from "./derivativesBoard";
import { NORMAL_OPEN } from "./market";

/** The twelve strategies the board can screen for, by key. */
export const BOARD_CALCULATORS: Record<string, Calculator> = {
  long_straddle: calculateLongStraddle,
  short_straddle: calculateShortStraddle,
  long_strangle: calculateLongStrangle,
  short_strangle: calculateShortStrangle,
  bull_call_spread: calculateBullCallSpread,
  bull_put_spread: calculateBullPutSpread,
  bear_call_spread: calculateBearCallSpread,
  bear_put_spread: calculateBearPutSpread,
  call_butterfly: calculateCallButterfly,
  put_butterfly: calculatePutButterfly,
  call_condor: calculateCallCondor,
  put_condor: calculatePutCondor,
};

/** One `tick` event from the relay: the rows that changed, plus the market state. */
export type RelayTick = { rows: LiveRow[]; live: boolean; status: string; now: number };
export type BoardFeed = { rows: Map<string, LiveRow>; live: boolean; status: string; now: number };
/** Where the connection stands. A stream that has not delivered a tick yet is "connecting". */
export type ConnState = "connecting" | "open" | "reconnecting";

/** A fresh board shows every live row, best profit to risk first. */
export const DEFAULT_BOARD_VIEW: View = {
  investment: "all",
  min: null,
  max: null,
  hideStale: true,
  search: "",
  sort: "roi",
  dir: "desc",
};

/** Fold a tick into the feed. Ticks carry only changed rows, so the rest are kept. */
export function mergeTick(prev: BoardFeed | null, tick: RelayTick): BoardFeed {
  const rows = new Map(prev?.rows);
  for (const row of tick.rows) rows.set(row.k, row);
  return { rows, live: tick.live, status: tick.status, now: tick.now };
}

export const isMarketOpen = (feed: BoardFeed | null) => feed?.status === NORMAL_OPEN;

/** Evaluate every company that has prices. `unavailable` counts the ones the strategy could not be built for. */
export function evaluateBoard(
  companies: Company[],
  feed: BoardFeed | null,
  strategy: string,
): { evaluations: Evaluation[]; unavailable: number } {
  const evaluations: Evaluation[] = [];
  let unavailable = 0;
  const calc = BOARD_CALCULATORS[strategy];
  if (!feed || !calc) return { evaluations, unavailable };
  const marketOpen = isMarketOpen(feed);
  for (const company of companies) {
    const row = feed.rows.get(company.k);
    if (!row) continue;
    const e = evaluate(strategy, calc, company, row, { now: feed.now, marketOpen });
    if (e) evaluations.push(e);
    else unavailable++;
  }
  return { evaluations, unavailable };
}

/** Rows the stale filter would hide (or fade), whatever the stale switch says. */
export function countStale(evaluations: Evaluation[], view: View): number {
  return applyView(evaluations, { ...view, hideStale: false }).filter((e) => e.stale).length;
}

/** The busy label next to the title, or null when the feed is flowing. */
export function connectionLabel(conn: ConnState, feed: BoardFeed | null): string | null {
  if (conn === "reconnecting") return "Reconnecting…";
  if (!feed) return "Connecting…";
  return !feed.live && isMarketOpen(feed) ? "Syncing…" : null;
}

/** "Showing 79 of 219 contracts", with the unavailable count when some could not be built. */
export function boardCountText(visible: number, total: number, unavailable: number): string {
  return `Showing ${visible} of ${total} contracts${unavailable ? `, ${unavailable} unavailable` : ""}`;
}

/** "140 stale rows are hidden" or "140 stale rows shown faded"; null when nothing is stale. */
export function staleNote(staleCount: number, hideStale: boolean): string | null {
  if (staleCount <= 0) return null;
  return `${staleCount} stale rows ${hideStale ? "are hidden" : "shown faded"}`;
}

/** An empty or unreadable rupee field means no limit. */
export const parseRupees = (s: string): number | null => (s.trim() === "" || Number.isNaN(Number(s)) ? null : Number(s));
