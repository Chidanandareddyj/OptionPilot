import { chartWindow, initialStrategyKey, legCards, netCashFlow, payoffTableRows, riskToReward, roiBase, strategiesOf, strategyCountsByView, strategyStats, analysisHeader } from "@/lib/analysis/model";
import { formatExpiry, formatSavedAt, signed, signedPercent } from "@/lib/analysis/format";
import { payoffPoints, strikeMarkers } from "@optionpilot/shared";
import { analysisResult, SPOT } from "./fixtures/analysis";

const result = analysisResult();
const strategies = strategiesOf(result);
const byKey = (key: string) => strategies.find((s) => s.key === key)!;

describe("formatting", () => {
  it("puts a sign on every non-zero amount", () => {
    expect(signed(5700)).toBe("+5,700");
    expect(signed(-4300)).toBe("\u22124,300");
    expect(signed(0)).toBe("0");
    expect(signed(-0.2)).toBe("0");
    expect(signedPercent(-1.13)).toBe("\u22121.13%");
    expect(signedPercent(0.42)).toBe("+0.42%");
  });

  it("formats an expiry without shifting the day", () => {
    expect(formatExpiry("2026-10-27")).toBe("27 Oct 2026");
    expect(formatExpiry("not a date")).toBe("not a date");
  });

  it("formats a saved time in IST", () => {
    expect(formatSavedAt("2026-10-23T16:57:00.000Z")).toBe("23 Oct, 10:27 pm IST");
    expect(formatSavedAt("2026-10-24T00:10:00.000Z")).toBe("24 Oct, 5:40 am IST");
    expect(formatSavedAt("nope")).toBe("");
  });
});

describe("analysis header", () => {
  it("reads symbol, spot, ATM, expiry and lot", () => {
    expect(analysisHeader(" reliance ", result)).toEqual({
      symbol: "RELIANCE",
      spot: SPOT,
      atm: 1190,
      expiry: "27 Oct 2026",
      lotSize: 500,
    });
  });

  it("falls back to the straddle strike for ATM and tolerates a bad payload", () => {
    const { atm_strike: _atm, ...rest } = result;
    expect(analysisHeader("X", rest).atm).toBe(1190);
    expect(analysisHeader("X", null)).toMatchObject({ spot: 0, atm: null, expiry: null, lotSize: 1 });
  });
});

describe("strategies", () => {
  it("builds all twelve from the calculator output", () => {
    expect(strategies).toHaveLength(12);
  });

  it("counts strategies by view like the design tiles", () => {
    expect(strategyCountsByView()).toEqual({ bullish: 2, bearish: 2, neutral: 6, volatile: 2 });
  });

  it("opens the saved recommendation, else the first strategy", () => {
    expect(initialStrategyKey(strategies, { mode: "single", best: { key: "bear_put_spread" } })).toBe("bear_put_spread");
    expect(initialStrategyKey(strategies, { view: "bullish", best: { key: "bear_put_spread" } })).toBe("bear_put_spread");
    expect(initialStrategyKey(strategies, { best: { key: "unknown" } })).toBe(strategies[0].key);
    expect(initialStrategyKey(strategies, null)).toBe(strategies[0].key);
    expect(initialStrategyKey([], null)).toBeNull();
  });
});

describe("bull call spread numbers match the design sample", () => {
  const spread = byKey("bull_call_spread");

  it("has the design's profit, loss, breakeven and ratio", () => {
    expect(spread.maxProfit).toBe(5700);
    expect(spread.maxLoss).toBe(4300);
    expect(spread.breakevens).toEqual([1188.6]);
    expect(riskToReward(spread)).toBe("1 : 1.33");
  });

  it("lists the six stats of the strip", () => {
    expect(strategyStats(spread, SPOT)).toEqual([
      { label: "Max profit", value: "+5,700", tone: "profit" },
      { label: "Max loss", value: "\u22124,300", tone: "loss" },
      { label: "Breakeven", value: "1,188.60", tone: undefined },
      { label: "Risk to reward", value: "1 : 1.33", tone: undefined },
      { label: "Net debit, 500 lot", value: "4,300.00", tone: undefined },
      { label: "Spot", value: "1,190.00", tone: undefined },
    ]);
  });

  it("builds 21 table rows with ROI against the debit and the spot row marked", () => {
    const rows = payoffTableRows(spread, SPOT);
    expect(rows).toHaveLength(21);
    expect(roiBase(spread)).toBe(4300);
    expect(rows[0]).toMatchObject({ price: 1090, pnl: -4300, isSpot: false });
    expect(rows[0].roi).toBeCloseTo(-100);
    expect(rows.filter((r) => r.isSpot).map((r) => r.price)).toEqual([1190]);
    expect(rows.find((r) => r.price === 1230)!.roi).toBeCloseTo((5700 / 4300) * 100);
  });

  it("builds the two leg cards and the net debit", () => {
    const cards = legCards(spread);
    expect(cards).toEqual([
      { title: "Lower call", action: "Buy", strike: "1,180 CE", premium: "₹14.20", quantity: "500", cashFlow: -7100 },
      { title: "Higher call", action: "Sell", strike: "1,200 CE", premium: "₹5.60", quantity: "500", cashFlow: 2800 },
    ]);
    expect(netCashFlow(cards)).toBe(-4300);
  });

  it("shows the chart around the strikes: 1,150 to 1,230", () => {
    const points = payoffPoints(spread.payoffTable);
    expect(chartWindow(points, strikeMarkers(spread.legs).map((m) => m.price))).toEqual([1150, 1230]);
  });
});

describe("bear put spread", () => {
  it("is the design's variant with 1 : 0.79 risk to reward", () => {
    const spread = byKey("bear_put_spread");
    expect(riskToReward(spread)).toBe("1 : 0.79");
    expect(legCards(spread).map((c) => c.title)).toEqual(["Higher put", "Lower put"]);
    expect(spread.breakevens).toEqual([1188.85]);
  });
});

describe("open-ended strategies", () => {
  it("shows Unlimited and no ratio for a long straddle", () => {
    const straddle = byKey("long_straddle");
    const stats = strategyStats(straddle, SPOT);
    expect(stats[0]).toEqual({ label: "Max profit", value: "Unlimited", tone: "profit" });
    expect(riskToReward(straddle)).toBeNull();
    expect(stats[2].label).toBe("Breakevens");
  });

  it("measures ROI of a credit strategy against its worst loss, or shows nothing", () => {
    const short = byKey("short_straddle");
    expect(roiBase(short)).toBeNull();
    expect(payoffTableRows(short, SPOT).every((r) => r.roi === null)).toBe(true);
  });

  it("clamps the window to the table when there are no strikes", () => {
    expect(chartWindow([{ price: 10, pnl: 0 }, { price: 20, pnl: 5 }], [])).toEqual([10, 20]);
  });
});
