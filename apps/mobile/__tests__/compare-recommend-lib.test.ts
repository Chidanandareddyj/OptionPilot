import { STRATEGY_DEFINITIONS, filterCount, visibleStrategies } from "@optionpilot/shared";
import { compareRows, roiText, strikeList } from "@/lib/analysis/compare";
import { strategiesOf } from "@/lib/analysis/model";
import {
  DEFAULT_MAX_LOSS,
  bestPick,
  cleanAmount,
  contextBadges,
  decideErrorMessage,
  decideInput,
  decisionSubtitle,
  groupAmount,
  parseAmount,
  rankedRows,
  summaryLines,
} from "@/lib/analysis/recommend";
import { ApiError } from "@/lib/api/client";
import { SignedOutError } from "@/lib/auth/errors";
import { layoutChart, type ChartInput } from "@/lib/chart/layout";
import { payoffPoints, strikeMarkers } from "@optionpilot/shared";
import { chartWindow } from "@/lib/analysis/model";
import { SPOT, analysisResult } from "./fixtures/analysis";
import { decide } from "./fixtures/decision";

const strategies = strategiesOf(analysisResult());
const byKey = (key: string) => strategies.find((s) => s.key === key)!;

describe("compare rows", () => {
  it("numbers the rows from 1 in the order given", () => {
    const rows = compareRows(strategies.slice(0, 3));
    expect(rows.map((r) => r.position)).toEqual(["01", "02", "03"]);
    expect(rows.map((r) => r.key)).toEqual(strategies.slice(0, 3).map((s) => s.key));
  });

  it("shows ROI, the strikes once each, and cost, profit and loss", () => {
    const [row] = compareRows([byKey("bull_call_spread")]);
    expect(row.name).toBe("Bull Call Spread");
    expect(row.roi).toMatch(/^ROI [\d,]+%$/);
    expect(row.strikes).toBe("1180 / 1200");
    expect(row.stats.map((s) => s.label)).toEqual(["Net debit", "Max profit", "Max loss"]);
    expect(row.stats[1].value.startsWith("+")).toBe(true);
    expect(row.stats[2].value.startsWith("-") || row.stats[2].value.startsWith("−")).toBe(true);
  });

  it("lists a straddle's shared strike once", () => {
    expect(strikeList(byKey("long_straddle"))).toBe("1190");
  });

  it("calls an open top Unlimited", () => {
    expect(roiText(byKey("long_straddle"))).toBe("Unlimited");
  });
});

describe("loss budget text", () => {
  it("keeps digits and one dot, with two decimals at most", () => {
    expect(cleanAmount("₹ 20,000")).toBe("20000");
    expect(cleanAmount("1.2.345")).toBe("1.23");
    expect(cleanAmount("abc")).toBe("");
  });

  it("groups the way Indian rupees are written, keeping what is typed after the dot", () => {
    expect(groupAmount("1250000")).toBe("12,50,000");
    expect(groupAmount("20000.")).toBe("20,000.");
    expect(groupAmount("0.5")).toBe("0.5");
    expect(groupAmount("")).toBe("");
  });

  it("accepts only a positive number", () => {
    expect(parseAmount("20000")).toBe(20000);
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
  });

  it("builds the request the server accepts, and null when it would refuse it", () => {
    expect(DEFAULT_MAX_LOSS).toBe(20000);
    expect(decideInput("an-1", "neutral", "20000")).toEqual({ analysisId: "an-1", view: "neutral", maxLoss: 20000, pane: undefined });
    expect(decideInput("an-1", "bullish", "500", "right")).toMatchObject({ pane: "right", maxLoss: 500 });
    expect(decideInput("an-1", "bullish", "0")).toBeNull();
    expect(decideInput("an-1", "bullish", "")).toBeNull();
  });

  it("explains each way scoring can fail", () => {
    expect(decideErrorMessage(new ApiError("gone", 404))).toMatch(/Run the analysis again/);
    expect(decideErrorMessage(new ApiError("Model is down", 500))).toBe("Model is down");
    expect(decideErrorMessage(new SignedOutError())).toMatch(/Sign in again/);
    expect(decideErrorMessage(new TypeError("Network request failed"))).toMatch(/Check your connection/);
  });
});

describe("recommendation text", () => {
  const decision = decide("neutral");

  it("titles the view and the budget", () => {
    expect(decisionSubtitle(decision)).toBe("Neutral view · max loss ₹20,000 per trade");
  });

  it("labels the context badges", () => {
    expect(contextBadges(decision).map((b) => b.label)).toEqual(["ATM IV", "30d RV", "IV/RV", "Lot", "DTE", "View", "Model"]);
    expect(contextBadges(decision).find((b) => b.label === "Model")?.value).toBe("unavailable (quant only)");
  });

  it("picks the best strategy, with its figures", () => {
    const pick = bestPick(decision)!;
    expect(pick.key).toBe(decision.best!.key);
    expect(pick.name).toBe(STRATEGY_DEFINITIONS[pick.key].name);
    expect(pick.caption).toBe("Recommended · top quant score");
    expect(pick.figures.map((f) => f.label)).toEqual(["POP", "EV", "Max loss", "Max profit", "Lot size"]);
  });

  it("has no pick when nothing is viable", () => {
    expect(bestPick(decide("bullish", 1))).toBeNull();
  });

  it("reads the summary's headings, bullets and text", () => {
    expect(summaryLines("# Why\n\n- **Cheap** entry\ntext **bold**")).toEqual([
      { kind: "heading", text: "Why" },
      { kind: "bullet", text: "Cheap entry" },
      { kind: "text", text: "text bold" },
    ]);
  });
});

describe("same ranking as the website", () => {
  // The website's explorer lists strategies with the shared visibleStrategies, which follows the server's ranking.
  for (const view of ["bullish", "bearish", "neutral", "volatile"] as const) {
    it(`${view}: the compare list and the top three are the server's order`, () => {
      const decision = decide(view);
      const serverOrder = decision.strategies.map((s) => s.key);
      const web = visibleStrategies(strategies, decision, "all", "").map((s) => s.key);
      const mobile = compareRows(visibleStrategies(strategies, decision, "all", "")).map((r) => r.key);
      expect(mobile).toEqual(web);
      expect(mobile).toEqual(serverOrder);
      expect(rankedRows(decision).map((r) => r.key)).toEqual(serverOrder.slice(0, 3));
      // Viable strategies come before the ones over the loss budget, each group by score.
      const viable = decision.strategies.map((s) => s.viable);
      expect(viable).toEqual([...viable].sort((a, b) => Number(b) - Number(a)));
    });
  }

  it("the filter counts add up to the strategies listed", () => {
    expect(filterCount(strategies, "all")).toBe(12);
    expect(visibleStrategies(strategies, decide("neutral"), "all", "")).toHaveLength(12);
  });
});

describe("compact chart layout", () => {
  const s = byKey("bull_call_spread");
  const points = payoffPoints(s.payoffTable);
  const markers = strikeMarkers(s.legs);
  const input = (compact: boolean): ChartInput => ({
    points,
    window: chartWindow(points, markers.map((m) => m.price)),
    strikes: markers,
    breakevens: s.breakevens,
    spot: SPOT,
    maxProfit: s.maxProfit,
    maxLoss: s.maxLoss,
    width: 340,
    height: 217,
    compact,
  });

  it("drops the ruler, the limit labels and the breakevens, and keeps five x ticks", () => {
    const full = layoutChart(input(false));
    const compact = layoutChart(input(true));
    expect(full.breakevens.length).toBeGreaterThan(0);
    expect(compact.breakevens).toEqual([]);
    expect(full.profit).not.toBeNull();
    expect(compact.profit).toBeNull();
    expect(compact.loss).toBeNull();
    expect(compact.ruler).toEqual([]);
    expect(compact.compact).toBe(true);
    expect(compact.xTicks).toHaveLength(5);
  });
});
