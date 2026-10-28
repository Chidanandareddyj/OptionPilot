import { BOARD_CALCULATORS, STRATEGY_DEFINITIONS, evaluateBoard, mergeTick, type BoardView, type Evaluation } from "@optionpilot/shared";
import {
  activeFilterCount,
  boardStatus,
  clearFilter,
  closedBanner,
  contractCard,
  filterChips,
  formatTradeTime,
  legSummary,
  MOBILE_BOARD_VIEW,
  nextOpenText,
  parseStrategy,
  resetFilters,
  shortExpiry,
  strategySegments,
} from "@/lib/derivatives/model";
import { contractDetail } from "@/lib/derivatives/detail";
import { UNIVERSE, FRIDAY_CLOSE, MONDAY_AFTERNOON, fullTick, liveRow, tickOf } from "./fixtures/relay";

const view = (patch: Partial<BoardView> = {}): BoardView => ({ ...MOBILE_BOARD_VIEW, ...patch });
const IST = (y: number, m: number, d: number, h: number, min = 0) => Date.UTC(y, m - 1, d, h, min) - 5.5 * 3600_000;

describe("filters", () => {
  it("has no chips or badge by default", () => {
    expect(filterChips(view())).toEqual([]);
    expect(activeFilterCount(view())).toBe(0);
  });

  it("makes a chip per filter that is on, in the order the sheet shows them", () => {
    const v = view({ investment: "low", min: 1500, max: 250000 });
    expect(filterChips(v)).toEqual([
      { id: "investment", label: "Investment: Low" },
      { id: "min", label: "Min ₹1,500" },
      { id: "max", label: "Max ₹2,50,000" },
    ]);
  });

  it("does not count showing stale rows, which the summary line states", () => {
    expect(filterChips(view({ hideStale: false }))).toEqual([]);
    expect(activeFilterCount(view({ hideStale: false }))).toBe(0);
  });

  it("counts a search in the badge but gives it no chip", () => {
    expect(filterChips(view({ search: "AB" }))).toEqual([]);
    expect(activeFilterCount(view({ search: "AB", investment: "high" }))).toBe(2);
    expect(activeFilterCount(view({ search: "   " }))).toBe(0);
  });

  it("clears one filter at a time, and all of them with the search on reset", () => {
    const v = view({ investment: "high", min: 5, max: 9, hideStale: false, search: "x" });
    expect(clearFilter(v, "investment").investment).toBe("all");
    expect(clearFilter(v, "min").min).toBeNull();
    expect(clearFilter(v, "max").max).toBeNull();
    expect(resetFilters(v)).toEqual(view());
  });
});

describe("strategies", () => {
  it("offers every strategy the board can price, in the website's order", () => {
    const keys = Object.keys(BOARD_CALCULATORS);
    expect(strategySegments().map((s) => s.value)).toEqual(keys);
    expect(strategySegments().map((s) => s.label)).toEqual(keys.map((key) => STRATEGY_DEFINITIONS[key].name));
    expect(keys).toHaveLength(12);
  });

  it("falls back to Bull Call Spread for an unknown link", () => {
    expect(parseStrategy("bear_put_spread")).toBe("bear_put_spread");
    expect(parseStrategy("nope")).toBe("bull_call_spread");
    expect(parseStrategy(undefined)).toBe("bull_call_spread");
  });
});

describe("card text", () => {
  it("summarises legs on one side and across sides", () => {
    expect(legSummary(["980CE", "1000CE"])).toBe("980 / 1000 CE");
    expect(legSummary(["5300CE", "5400CE"])).toBe("5300 / 5400 CE");
    expect(legSummary(["100CE", "100PE"])).toBe("100 CE / 100 PE");
    expect(legSummary([])).toBe("");
  });

  it("shortens an expiry", () => {
    expect(shortExpiry("2026-10-23")).toBe("23 Oct");
  });

  it("writes the card the way the design does", () => {
    const e = { k: "k", symbol: "360ONE", stale: null, lot: 500, spot: 987.1, legs: ["980CE", "1000CE"], expiry: "2026-10-23", roi: 1.034, maxProfit: 5075, maxLoss: 4925, beDistancePct: 0.28 } as unknown as Evaluation;
    expect(contractCard(e)).toEqual({
      key: "k",
      symbol: "360ONE",
      stale: false,
      roi: "1.03",
      meta: "lot 500 · spot 987.10 · 980 / 1000 CE · 23 Oct",
      stats: [
        { label: "Max profit per lot", value: "+₹5,075", tone: "profit" },
        { label: "Max loss per lot", value: "−₹4,925", tone: "loss" },
        { label: "Breakeven away", value: "0.28%" },
      ],
    });
  });

  it("shows unlimited sides and a missing ratio as words and a dash", () => {
    const e = { k: "k", symbol: "S", stale: "x", lot: 1, spot: 1, legs: [], expiry: "2026-10-23", roi: null, maxProfit: null, maxLoss: 1600, beDistancePct: null } as unknown as Evaluation;
    const card = contractCard(e);
    expect(card.roi).toBe("—");
    expect(card.stale).toBe(true);
    expect(card.stats.map((s) => s.value)).toEqual(["Unlimited", "−₹1,600", "—"]);
  });
});

describe("market closed", () => {
  it("writes IST times in the 12-hour form", () => {
    expect(formatTradeTime(IST(2026, 10, 23, 15, 30))).toBe("Friday 23 Oct 2026, 3:30 pm IST");
    expect(formatTradeTime(IST(2026, 10, 26, 0, 5))).toBe("Monday 26 Oct 2026, 12:05 am IST");
    expect(formatTradeTime(IST(2026, 10, 26, 12, 0))).toBe("Monday 26 Oct 2026, 12:00 pm IST");
  });

  it("names when NSE next opens, skipping weekends", () => {
    expect(nextOpenText(IST(2026, 10, 26, 7))).toBe("today at 9:15 am IST");
    expect(nextOpenText(IST(2026, 10, 26, 16))).toBe("tomorrow at 9:15 am IST");
    expect(nextOpenText(IST(2026, 10, 23, 16))).toBe("on Monday at 9:15 am IST");
    expect(nextOpenText(IST(2026, 10, 24, 11))).toBe("on Monday at 9:15 am IST");
    expect(nextOpenText(IST(2026, 10, 25, 11))).toBe("tomorrow at 9:15 am IST");
  });

  it("quotes the latest trade and the next open", () => {
    const feed = mergeTick(null, tickOf(UNIVERSE.map((c) => liveRow(c, FRIDAY_CLOSE)), FRIDAY_CLOSE + 3600_000, "CLOSED", false));
    expect(closedBanner(feed)).toEqual({
      title: "Market closed. Showing last close.",
      message: "Prices are from Friday 23 Oct 2026, 3:30 pm IST. They refresh when NSE opens on Monday at 9:15 am IST.",
    });
  });
});

describe("boardStatus", () => {
  const open = mergeTick(null, fullTick());
  it("is Offline whenever the device has no network", () => {
    expect(boardStatus({ online: false, conn: "open", label: null, feed: open })).toEqual({ kind: "offline", label: "Offline" });
  });
  it("shows the busy word while connecting or reconnecting", () => {
    expect(boardStatus({ online: true, conn: "reconnecting", label: "Reconnecting…", feed: open })).toEqual({ kind: "busy", label: "Reconnecting…" });
  });
  it("is empty before the first tick", () => {
    expect(boardStatus({ online: true, conn: "open", label: null, feed: null })).toBeNull();
  });
  it("is the NSE pill with the feed's clock when open, and closed otherwise", () => {
    expect(boardStatus({ online: true, conn: "open", label: null, feed: open })).toMatchObject({ kind: "open", clock: "14:46" });
    const closed = mergeTick(null, tickOf([], MONDAY_AFTERNOON, "CLOSED", false));
    expect(boardStatus({ online: true, conn: "open", label: null, feed: closed })).toEqual({ kind: "closed", label: "NSE closed" });
  });
});

describe("contractDetail", () => {
  const feed = mergeTick(null, fullTick());
  const company = UNIVERSE[0];

  it("agrees with the board's evaluation of the same contract", () => {
    const detail = contractDetail(company, feed, "bull_call_spread")!;
    const board = evaluateBoard(UNIVERSE, feed, "bull_call_spread").evaluations.find((e) => e.k === company.k)!;
    expect(detail.evaluation).toEqual(board);
    expect(detail.stats.map((s) => s.label)).toEqual(["Max profit per lot", "Max loss per lot", "Investment", "Profit to risk", "Breakeven away", "Breakeven"]);
    expect(detail.stats[3].value).toBe(board.roi!.toFixed(2));
  });

  it("builds the payoff table per lot and marks the price nearest spot", () => {
    const { rows, evaluation } = contractDetail(company, feed, "bull_call_spread")!;
    expect(rows.length).toBeGreaterThan(3);
    expect(rows.filter((r) => r.nearest)).toHaveLength(1);
    const nearest = rows.find((r) => r.nearest)!;
    expect(rows.every((r) => Math.abs(r.price - evaluation.spot) >= Math.abs(nearest.price - evaluation.spot))).toBe(true);
    const lowest = rows[0];
    expect(lowest.pnl).toBeCloseTo(-(evaluation.maxLoss ?? 0), 0);
  });

  it("is null for a company with no prices or a strategy it does not know", () => {
    expect(contractDetail(company, mergeTick(null, tickOf([], MONDAY_AFTERNOON)), "bull_call_spread")).toBeNull();
    expect(contractDetail(company, feed, "nonsense")).toBeNull();
  });
});
