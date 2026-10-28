import assert from "node:assert/strict";
import test from "node:test";
import { alertCopy, alertsAllowed, istDate, savedBreakevens, snapshotAlerts } from "./alerts.ts";

const result = {
  underlying_spot_price: 100,
  bull_call_spread: { breakeven: 105, lower_strike: 95, higher_strike: 110, spot_price: 100 },
  bear_put_spread: { breakeven: 90, long_put_strike: 100, short_put_strike: 90, spot_price: 100 },
};

test("snapshotAlerts is quiet inside the band and exactly at 2%", () => {
  assert.deepEqual(snapshotAlerts({ savedSpot: 100, livePrice: 101, breakevens: [110] }), []);
  assert.deepEqual(snapshotAlerts({ savedSpot: 100, livePrice: 102, breakevens: [] }), []);
});

test("snapshotAlerts fires a move above 2% and a breakeven only when the price has passed it", () => {
  assert.deepEqual(snapshotAlerts({ savedSpot: 100, livePrice: 102.01, breakevens: [] }), ["move"]);
  assert.deepEqual(snapshotAlerts({ savedSpot: 100, livePrice: 106, breakevens: [105] }), ["breakeven", "move"]);
  assert.deepEqual(snapshotAlerts({ savedSpot: 100, livePrice: 105, breakevens: [105] }), ["move"]);
  assert.deepEqual(snapshotAlerts({ savedSpot: 100, livePrice: 94, breakevens: [95] }), ["breakeven", "move"]);
});

test("snapshotAlerts ignores a missing or non-positive price", () => {
  assert.deepEqual(snapshotAlerts({ savedSpot: 0, livePrice: 10, breakevens: [5] }), []);
  assert.deepEqual(snapshotAlerts({ savedSpot: 100, livePrice: Number.NaN, breakevens: [90] }), []);
});

test("savedBreakevens uses the best strategy, and both panes of a compare", () => {
  assert.deepEqual(savedBreakevens(result, { best: { key: "bull_call_spread" } }), [105]);
  assert.deepEqual(savedBreakevens(result, { view: "bullish" }), []);
  assert.deepEqual(
    savedBreakevens(result, {
      compare: true,
      left: { best: { key: "bull_call_spread" } },
      right: { best: { key: "bear_put_spread" } },
    }),
    [105, 90],
  );
});

test("istDate rolls over at midnight IST", () => {
  assert.equal(istDate(new Date(Date.UTC(2026, 9, 28, 18, 29))), "2026-10-28");
  assert.equal(istDate(new Date(Date.UTC(2026, 9, 28, 18, 30))), "2026-10-29");
});

test("alerts run only while NSE is open", () => {
  assert.equal(alertsAllowed(new Date(Date.UTC(2026, 9, 26, 9, 16))), true);
  assert.equal(alertsAllowed(new Date(Date.UTC(2026, 9, 24, 9, 16))), false);
});

test("alertCopy names the company and both prices", () => {
  assert.equal(alertCopy({ company: "RELIANCE", kind: "breakeven", savedSpot: 100, livePrice: 110 }).title, "RELIANCE crossed a breakeven");
  assert.match(alertCopy({ company: "TCS", kind: "move", savedSpot: 100, livePrice: 103 }).title, /^TCS moved 3\.0%$/);
});
