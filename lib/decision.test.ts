import assert from "node:assert/strict";
import test from "node:test";
import { analyzeLegs, payoff, scoreStrategies, type Chain, type Leg } from "./decision.ts";

const leg = (type: "CE" | "PE", strike: number, qty: number, premium: number): Leg => ({
  type,
  strike,
  qty,
  premium,
  instrument_key: `${type}${strike}`,
});

test("bull call spread payoff is capped on both sides", () => {
  const spread = [leg("CE", 100, 1, 6), leg("CE", 110, -1, 2)];
  assert.equal(payoff(spread, 90), -4);
  assert.equal(payoff(spread, 104), 0);
  assert.equal(payoff(spread, 107), 3);
  assert.equal(payoff(spread, 130), 6);
  const m = analyzeLegs(spread, 105, 0.25, 0.1);
  assert.equal(m.maxLoss, 4);
  assert.equal(m.maxProfit, 6);
  assert.deepEqual(m.breakevens, [104]);
});

test("long straddle POP is a probability and rises with IV", () => {
  const straddle = [leg("CE", 100, 1, 5), leg("PE", 100, 1, 5)];
  const low = analyzeLegs(straddle, 100, 0.2, 0.25).pop;
  const high = analyzeLegs(straddle, 100, 0.4, 0.25).pop;
  assert.ok(low > 0 && low < 1 && high > 0 && high < 1);
  assert.ok(high > low);
});

test("short straddle max loss is the 2-sigma move loss", () => {
  const m = analyzeLegs([leg("CE", 100, -1, 5), leg("PE", 100, -1, 5)], 100, 0.2, 0.25);
  assert.equal(m.undefinedRisk, true);
  assert.equal(m.maxProfit, 10);
  assert.ok(Math.abs(m.maxLoss - (100 * Math.exp(0.2) - 100 - 10)) < 1e-9);
});

test("a view mismatch lowers the score", () => {
  const quote = (bid: number) => ({ bid_price: bid, ask_price: bid + 0.2, ltp: bid, oi: 100_000 });
  const chain: Chain = {
    data: [95, 100, 105].map((strike) => ({
      strike_price: strike,
      underlying_spot_price: 100,
      call_options: { instrument_key: `C${strike}`, market_data: quote(Math.max(100 - strike, 0) + 3), option_greeks: { iv: 25 } },
      put_options: { instrument_key: `P${strike}`, market_data: quote(Math.max(strike - 100, 0) + 3), option_greeks: { iv: 25 } },
    })),
  };
  const result = {
    expiry_date: "2099-01-01",
    bull_call_spread: { lower_strike: 95, lower_call_instrument_key: "C95", higher_strike: 105, higher_call_instrument_key: "C105" },
  };
  const score = (view: "bullish" | "bearish") =>
    scoreStrategies({ result, chain, lotSize: 100, closes: [], view, maxLoss: 1e9, now: Date.parse("2098-12-01") })
      .strategies.find((s) => s.key === "bull_call_spread")!;
  const bullish = score("bullish");
  assert.equal(bullish.viable, true);
  assert.ok(bullish.quant > score("bearish").quant + 30);
});
