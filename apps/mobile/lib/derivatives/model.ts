import {
  BOARD_CALCULATORS,
  DEFAULT_BOARD_VIEW,
  STRATEGY_DEFINITIONS,
  signedInr,
  type BoardFeed,
  type BoardView,
  type Category,
  type ConnState,
  type Evaluation,
} from "@optionpilot/shared";
import { formatExpiry } from "@/lib/analysis/format";
import { formatIstClock, type MarketStatus } from "@/lib/market/status";

const IST_OFFSET_MS = 5.5 * 3600_000;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** NSE opens at 9:15 am IST, in minutes after midnight. */
const OPEN_MINUTES = 9 * 60 + 15;

/** The board's starting view. The web opens ranked by profit to risk; the phone's designs list companies A to Z, and it has no sort control. */
export const MOBILE_BOARD_VIEW: BoardView = { ...DEFAULT_BOARD_VIEW, sort: "symbol", dir: "asc" };

/** The board opens on Bull Call Spread, the same strategy the designs show selected. */
export const DEFAULT_STRATEGY = "bull_call_spread";

/** The strategy each Terminal "Browse by view" tile opens the board with. */
export const VIEW_STRATEGY: Record<Category, string> = {
  bullish: "bull_call_spread",
  bearish: "bear_put_spread",
  neutral: "call_butterfly",
  volatile: "long_straddle",
};

export const strategyName = (key: string) => STRATEGY_DEFINITIONS[key]?.name ?? key;

/** Every strategy the board can price, in the same order as the website's dropdown. */
export function strategySegments(): { value: string; label: string }[] {
  return Object.keys(BOARD_CALCULATORS).map((value) => ({ value, label: strategyName(value) }));
}

/** A strategy key from a link, or the default when it names nothing the board knows. */
export const parseStrategy = (value: string | undefined) => (value && STRATEGY_DEFINITIONS[value] ? value : DEFAULT_STRATEGY);

const rupees = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export type FilterId = "investment" | "min" | "max";

/** One removable chip under the switcher per filter that is on. Search lives in its own box, and showing stale rows is said in the summary line instead. */
export function filterChips(view: BoardView): { id: FilterId; label: string }[] {
  const chips: { id: FilterId; label: string }[] = [];
  if (view.investment !== "all") chips.push({ id: "investment", label: `Investment: ${view.investment === "low" ? "Low" : "High"}` });
  if (view.min != null) chips.push({ id: "min", label: `Min ${rupees(view.min)}` });
  if (view.max != null) chips.push({ id: "max", label: `Max ${rupees(view.max)}` });
  return chips;
}

/** The badge on the filter button: every filter that is on, and the search text. */
export const activeFilterCount = (view: BoardView) => filterChips(view).length + (view.search.trim() ? 1 : 0);

/** The view with one filter switched off. */
export function clearFilter(view: BoardView, id: FilterId): BoardView {
  if (id === "investment") return { ...view, investment: "all" };
  if (id === "min") return { ...view, min: null };
  return { ...view, max: null };
}

/** Filters back to their defaults. The search text goes too, as "Clear filters" under no matches promises. */
export const resetFilters = (view: BoardView): BoardView => ({
  ...view,
  investment: "all",
  min: null,
  max: null,
  hideStale: true,
  search: "",
});

/** "980 / 1000 CE" for one side, "980 CE / 980 PE" when calls and puts mix. */
export function legSummary(legs: string[]): string {
  const parsed = legs.map((leg) => /^(\d+(?:\.\d+)?)(CE|PE)$/.exec(leg)).filter((m): m is RegExpExecArray => m !== null);
  if (parsed.length === 0) return "";
  const sides = new Set(parsed.map((m) => m[2]));
  if (sides.size === 1) return `${parsed.map((m) => Number(m[1])).join(" / ")} ${parsed[0][2]}`;
  return parsed.map((m) => `${Number(m[1])} ${m[2]}`).join(" / ");
}

/** "23 Oct" from "2026-10-23". */
export const shortExpiry = (iso: string) => formatExpiry(iso).replace(/ \d{4}$/, "");

const spotText = (spot: number) => spot.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const limit = (value: number | null, sign: 1 | -1) => (value == null ? "Unlimited" : signedInr(sign * Math.abs(value)));

export type ContractCard = {
  key: string;
  symbol: string;
  stale: boolean;
  /** "1.03", or an em dash when profit or loss is unlimited. */
  roi: string;
  /** "lot 500 · spot 987.10 · 980 / 1000 CE · 23 Oct". */
  meta: string;
  stats: { label: string; value: string; tone?: "profit" | "loss" }[];
};

/** What one board card says. */
export function contractCard(e: Evaluation): ContractCard {
  const meta = [`lot ${e.lot.toLocaleString("en-IN")}`, `spot ${spotText(e.spot)}`, legSummary(e.legs), shortExpiry(e.expiry)];
  return {
    key: e.k,
    symbol: e.symbol,
    stale: e.stale !== null,
    roi: e.roi == null ? "—" : e.roi.toFixed(2),
    meta: meta.filter(Boolean).join(" · "),
    stats: [
      { label: "Max profit per lot", value: limit(e.maxProfit, 1), tone: "profit" },
      { label: "Max loss per lot", value: limit(e.maxLoss, -1), tone: "loss" },
      { label: "Breakeven away", value: e.beDistancePct == null ? "—" : `${e.beDistancePct.toFixed(2)}%` },
    ],
  };
}

/** The latest trade time among the legs the board holds: when the prices on screen were last true. */
export function lastTradeTime(feed: BoardFeed | null): number | null {
  if (!feed) return null;
  let latest = 0;
  for (const row of feed.rows.values()) {
    for (const leg of row.w) latest = Math.max(latest, leg[2], leg[4]);
  }
  return latest > 0 ? latest : null;
}

const istParts = (ms: number) => {
  const ist = new Date(ms + IST_OFFSET_MS);
  return { day: ist.getUTCDay(), date: ist.getUTCDate(), month: ist.getUTCMonth(), year: ist.getUTCFullYear(), minutes: ist.getUTCHours() * 60 + ist.getUTCMinutes() };
};

/** "Friday 23 Oct 2026, 3:30 pm IST". */
export function formatTradeTime(ms: number): string {
  const p = istParts(ms);
  const hours = Math.floor(p.minutes / 60);
  const minutes = String(p.minutes % 60).padStart(2, "0");
  return `${DAYS[p.day]} ${p.date} ${MONTHS[p.month]} ${p.year}, ${hours % 12 || 12}:${minutes} ${hours >= 12 ? "pm" : "am"} IST`;
}

/** "today at 9:15 am IST", "tomorrow at …", or "on Monday at …": when NSE next opens. Weekends are skipped, holidays are not known. */
export function nextOpenText(nowMs: number): string {
  const p = istParts(nowMs);
  const weekday = p.day >= 1 && p.day <= 5;
  if (weekday && p.minutes < OPEN_MINUTES) return "today at 9:15 am IST";
  let ahead = 1;
  while ([0, 6].includes((p.day + ahead) % 7)) ahead += 1;
  return `${ahead === 1 ? "tomorrow" : `on ${DAYS[(p.day + ahead) % 7]}`} at 9:15 am IST`;
}

/** The two lines of the closed-market banner. */
export function closedBanner(feed: BoardFeed): { title: string; message: string } {
  const traded = lastTradeTime(feed);
  const from = traded ? `Prices are from ${formatTradeTime(traded)}.` : "Prices are the last traded values.";
  return {
    title: "Market closed. Showing last close.",
    message: `${from} They refresh when NSE opens ${nextOpenText(feed.now)}.`,
  };
}

/** What the top right of the board shows: a busy word while connecting, else the market pill. */
export function boardStatus(input: { online: boolean; conn: ConnState; label: string | null; feed: BoardFeed | null }): MarketStatus | null {
  if (!input.online) return { kind: "offline", label: "Offline" };
  if (input.label) return { kind: "busy", label: input.label };
  if (!input.feed) return null;
  if (input.feed.status !== "NORMAL_OPEN") return { kind: "closed", label: "NSE closed" };
  return { kind: "open", label: "NSE open", clock: formatIstClock(new Date(input.feed.now)) };
}
