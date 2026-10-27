import assert from "node:assert/strict";
import test from "node:test";
import {
  COMPARE_FILTERS,
  asDecision,
  filterCount,
  initialCompareState,
  paneStrategies,
  visibleStrategies,
} from "./compare.ts";
import { mergeCompareDecision } from "./analysis.ts";
import type { Decision } from "./contracts.ts";
import { rankDecision, scoreStrategies, type Chain } from "./decision.ts";
import {
  calculateBearCallSpread,
  calculateBearPutSpread,
  calculateBullCallSpread,
  calculateBullPutSpread,
  calculateCallButterfly,
  calculateCallCondor,
  calculateLongStraddle,
  calculateLongStrangle,
  calculatePutButterfly,
  calculatePutCondor,
  calculateShortStraddle,
  calculateShortStrangle,
} from "./strategies/index.ts";
import { STRATEGY_DEFINITIONS, normalizeStrategy } from "./types.ts";

const SPOT = 1190;
const LOT = 500;
const NOW = Date.parse("2026-10-23T10:00:00+05:30");

// A liquid RELIANCE-like chain: every strike has a two-sided market and plenty of open interest.
function chain() {
  const data = [];
  for (let strike = 1090; strike <= 1290; strike += 10) {
    const time = 9 * Math.exp(-Math.abs(strike - SPOT) / 35);
    const quote = (value: number) => ({ ltp: value, bid_price: value - 0.1, ask_price: value + 0.1, oi: 1_000_000 });
    data.push({
      strike_price: strike,
      underlying_spot_price: SPOT,
      call_options: {
        instrument_key: `NSE_FO|${strike}CE`,
        market_data: quote(Math.max(SPOT - strike, 0) + time),
        option_greeks: { iv: 22 },
      },
      put_options: {
        instrument_key: `NSE_FO|${strike}PE`,
        market_data: quote(Math.max(strike - SPOT, 0) + time),
        option_greeks: { iv: 22 },
      },
    });
  }
  return { data };
}

function analysis() {
  const c = chain();
  return {
    underlying_key: "NSE_EQ|INE002A01018",
    expiry_date: "2026-10-27",
    lot_size: LOT,
    underlying_spot_price: SPOT,
    atm_strike: SPOT,
    long_straddle: calculateLongStraddle(c, 10),
    bull_call_spread: calculateBullCallSpread(c, 10),
    bull_put_spread: calculateBullPutSpread(c, 10),
    call_butterfly: calculateCallButterfly(c, 10),
    put_butterfly: calculatePutButterfly(c, 10),
    call_condor: calculateCallCondor(c, 10),
    put_condor: calculatePutCondor(c, 10),
    bear_call_spread: calculateBearCallSpread(c, 10),
    bear_put_spread: calculateBearPutSpread(c, 10),
    long_strangle: calculateLongStrangle(c, 10),
    short_straddle: calculateShortStraddle(c, 10),
    short_strangle: calculateShortStrangle(c, 10),
  };
}

const result = analysis();
const strategies = Object.keys(STRATEGY_DEFINITIONS).flatMap((key) => normalizeStrategy(key, result[key as keyof typeof result], SPOT, LOT) ?? []);

// What POST /api/decide computes before it asks the language model (none here, so the quant ranking stands).
const decide = (view: "bullish" | "bearish" | "neutral" | "volatile", maxLoss = 20000): Decision =>
  rankDecision(scoreStrategies({ result, chain: chain() as Chain, lotSize: LOT, closes: [], view, maxLoss, now: NOW }), null);

test("fixture: all twelve strategies normalise", () => {
  assert.equal(strategies.length, 12);
});

test("with no recommendation the list is in catalogue order", () => {
  const keys = visibleStrategies(strategies, null, "all", "").map((s) => s.key);
  assert.deepEqual(keys, Object.keys(STRATEGY_DEFINITIONS));
});

test("with a recommendation the list follows the server's ranking, whatever the view", () => {
  for (const view of ["bullish", "bearish", "neutral", "volatile"] as const) {
    const decision = decide(view);
    const keys = visibleStrategies(strategies, decision, "all", "").map((s) => s.key);
    assert.deepEqual(keys, decision.strategies.map((s) => s.key), view);
  }
});

test("a filter keeps the ranking order of what is left", () => {
  const decision = decide("bearish");
  const order = decision.strategies.map((s) => s.key);
  for (const { id } of COMPARE_FILTERS) {
    const shown = visibleStrategies(strategies, decision, id, "").map((s) => s.key);
    assert.deepEqual(shown, order.filter((key) => id === "all" || STRATEGY_DEFINITIONS[key].category === id), id);
    assert.equal(shown.length, filterCount(strategies, id), id);
  }
});

test("the search matches the name or the tagline, ignoring case and spaces at the ends", () => {
  assert.deepEqual(visibleStrategies(strategies, null, "all", "  BUTTERFLY ").map((s) => s.key), ["call_butterfly", "put_butterfly"]);
  assert.equal(visibleStrategies(strategies, null, "all", "zzz").length, 0);
  assert.ok(visibleStrategies(strategies, null, "all", "limited downside").length > 0);
});

test("strategies the recommendation did not rank are listed last, in catalogue order", () => {
  const decision = decide("neutral");
  const partial = { ...decision, strategies: decision.strategies.slice(0, 2) };
  const keys = visibleStrategies(strategies, partial, "all", "").map((s) => s.key);
  assert.deepEqual(keys.slice(0, 2), partial.strategies.map((s) => s.key));
  const rest = Object.keys(STRATEGY_DEFINITIONS).filter((key) => !keys.slice(0, 2).includes(key));
  assert.deepEqual(keys.slice(2), rest);
});

test("the recommendation's best strategy is listed first when it is viable", () => {
  const decision = decide("neutral");
  assert.ok(decision.best);
  assert.equal(visibleStrategies(strategies, decision, "all", "")[0].key, decision.best.key);
});

test("a tight budget makes no strategy viable and still ranks them", () => {
  const decision = decide("bullish", 1);
  assert.equal(decision.best, null);
  assert.ok(decision.strategies.every((s) => !s.viable));
  assert.deepEqual(visibleStrategies(strategies, decision, "all", "").map((s) => s.key), decision.strategies.map((s) => s.key));
});

test("asDecision accepts a recommendation and rejects anything else", () => {
  const decision = decide("neutral");
  assert.equal(asDecision(decision), decision);
  for (const value of [null, undefined, 3, "x", {}, { strategies: "no" }]) assert.equal(asDecision(value), null);
});

test("a saved single recommendation opens on its pick, and fills the left pane", () => {
  const decision = decide("neutral");
  const state = initialCompareState(decision);
  assert.equal(state.compareMode, false);
  assert.equal(state.single, decision);
  assert.equal(state.left, decision);
  assert.equal(state.right, null);
  assert.deepEqual(state.selected, { left: decision.best!.key, right: null });
});

test("a saved compare recommendation opens in compare mode with each pane's pick", () => {
  const left = decide("bullish");
  const right = decide("bearish");
  const saved = mergeCompareDecision(mergeCompareDecision(null, "left", left), "right", right);
  const state = initialCompareState(saved);
  assert.equal(state.compareMode, true);
  assert.equal(state.single, null);
  assert.deepEqual(state.selected, { left: left.best!.key, right: right.best!.key });
  assert.equal(state.left!.view, "bullish");
  assert.equal(state.right!.view, "bearish");
});

test("with nothing saved the panes show the first two strategies", () => {
  const state = initialCompareState(null);
  assert.deepEqual([state.compareMode, state.single, state.left, state.right], [false, null, null, null]);
  const panes = paneStrategies(strategies, state.selected);
  assert.equal(panes.left!.key, strategies[0].key);
  assert.equal(panes.right!.key, strategies[1].key);
});

test("a pane shows its selected strategy, and a lone strategy fills both panes", () => {
  const panes = paneStrategies(strategies, { left: "put_condor", right: "long_strangle" });
  assert.deepEqual([panes.left!.key, panes.right!.key], ["put_condor", "long_strangle"]);
  assert.equal(paneStrategies(strategies.slice(0, 1), { left: null, right: null }).right!.key, strategies[0].key);
  assert.deepEqual(paneStrategies([], { left: null, right: null }), { left: null, right: null });
});
