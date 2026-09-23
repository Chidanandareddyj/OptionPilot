import assert from "node:assert/strict";
import test from "node:test";
import { normalizeStrategy, STRATEGY_DEFINITIONS } from "./types.ts";

test("STRATEGY_DEFINITIONS contains all 12 key strategies", () => {
  const expectedKeys = [
    "bull_call_spread",
    "bull_put_spread",
    "bear_call_spread",
    "bear_put_spread",
    "long_straddle",
    "short_straddle",
    "long_strangle",
    "short_strangle",
    "call_butterfly",
    "put_butterfly",
    "call_condor",
    "put_condor",
  ];

  for (const key of expectedKeys) {
    assert.ok(STRATEGY_DEFINITIONS[key], `Missing strategy definition for ${key}`);
    assert.ok(STRATEGY_DEFINITIONS[key].name);
    assert.ok(STRATEGY_DEFINITIONS[key].category);
  }
});

test("normalizeStrategy normalizes Long Straddle data", () => {
  const mockLongStraddle = {
    spot_price: 22500,
    strike_price: 22500,
    call_instrument_key: "NSE_FO|12345",
    put_instrument_key: "NSE_FO|12346",
    call_premium: 120.5,
    put_premium: 95.5,
    total_premium: 216,
    lower_breakeven: 22284,
    upper_breakeven: 22716,
    payoff_table: [
      { closing_price: 22000, call_pl: -120.5, put_pl: 404.5, net_pl: 284 },
      { closing_price: 22500, call_pl: -120.5, put_pl: -95.5, net_pl: -216 },
      { closing_price: 23000, call_pl: 379.5, put_pl: -95.5, net_pl: 284 },
    ],
  };

  const normalized = normalizeStrategy("long_straddle", mockLongStraddle, 22500);
  assert.ok(normalized);
  assert.equal(normalized.name, "Long Straddle");
  assert.equal(normalized.category, "volatile");
  assert.equal(normalized.spotPrice, 22500);
  assert.equal(normalized.costOrCredit.amount, 216);
  assert.equal(normalized.maxProfit, "Unlimited");
  assert.equal(normalized.maxLoss, 216);
  assert.deepEqual(normalized.breakevens, [22284, 22716]);
  assert.equal(normalized.payoffTable.length, 3);
  assert.equal(normalized.legs.length, 2);
  assert.equal(normalized.legs[0].action, "Buy");
  assert.equal(normalized.legs[0].premium, 120.5);
  assert.equal(normalized.legs[1].instrumentKey, "NSE_FO|12346");
});

test("normalizeStrategy reads condor and bear put spread legs", () => {
  const condor = normalizeStrategy("put_condor", {
    lower_strike: 22300,
    lower_middle_strike: 22400,
    upper_middle_strike: 22600,
    upper_strike: 22700,
    lower_middle_put_premium: 40,
  });
  assert.deepEqual(condor?.legs.map((l) => [l.action, l.strike, l.type]), [
    ["Buy", 22300, "put"],
    ["Sell", 22400, "put"],
    ["Sell", 22600, "put"],
    ["Buy", 22700, "put"],
  ]);
  assert.equal(condor?.legs[1].premium, 40);

  const bearPut = normalizeStrategy("bear_put_spread", { long_put_strike: 22600, short_put_strike: 22400 });
  assert.deepEqual(bearPut?.legs.map((l) => [l.action, l.strike]), [["Buy", 22600], ["Sell", 22400]]);
});

test("normalizeStrategy treats short straddle loss as unlimited", () => {
  const s = normalizeStrategy("short_straddle", { strike_price: 22500, total_premium: 216 });
  assert.equal(s?.maxProfit, 216);
  assert.equal(s?.maxLoss, "Unlimited");
  assert.equal(s?.costOrCredit.label, "Credit received");
});

test("normalizeStrategy normalizes Bull Call Spread data", () => {
  const mockBullCallSpread = {
    spot_price: 22500,
    lower_strike: 22400,
    higher_strike: 22600,
    lower_call_premium: 180,
    higher_call_premium: 70,
    net_debit: 110,
    max_profit: 90,
    max_loss: 110,
    breakeven: 22510,
    payoff_table: [
      { closing_price: 22300, long_call_pl: -180, short_call_pl: 70, net_pl: -110 },
      { closing_price: 22700, long_call_pl: 120, short_call_pl: -30, net_pl: 90 },
    ],
  };

  const normalized = normalizeStrategy("bull_call_spread", mockBullCallSpread, 22500);
  assert.ok(normalized);
  assert.equal(normalized.name, "Bull Call Spread");
  assert.equal(normalized.category, "bullish");
  assert.equal(normalized.maxProfit, 90);
  assert.equal(normalized.maxLoss, 110);
  assert.deepEqual(normalized.breakevens, [22510]);
  assert.equal(normalized.legs.length, 2);
  assert.equal(normalized.legs[0].action, "Buy");
  assert.equal(normalized.legs[1].action, "Sell");
});
