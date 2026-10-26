import assert from "node:assert/strict";
import test from "node:test";
import { calculateBullCallSpread } from "./strategies/BullCallSpread.ts";
import { calculateShortStraddle } from "./strategies/ShortStraddle.ts";
import { applyView, evaluate, type Company, type Evaluation, type LiveRow, type View } from "./derivativesBoard.ts";

const company: Company = { k: "X", s: "X", n: "X", e: "2026-10-27", l: 100, strikes: [80, 90, 100, 110, 120, 130] };
const NOW = 10_000_000;
// Spot 100 -> ATM 100. Bull call spread buys 90C @ 14, sells 110C @ 4 -> debit 10, width 20.
const row = (ltt = NOW, ltp110 = 4): LiveRow => ({
  k: "X",
  sp: 100,
  w: [
    [90, 14, ltt, 1, ltt],
    [100, 7, ltt, 6, ltt],
    [110, ltp110, ltt, 12, ltt],
  ],
});
const ctx = { now: NOW, marketOpen: true };

test("bull call spread: per-lot profit, loss and investment", () => {
  const e = evaluate("bull_call_spread", calculateBullCallSpread, company, row(), ctx)!;
  assert.equal(e.maxProfit, 1000); // (20 - 10) * 100
  assert.equal(e.maxLoss, 1000); // 10 * 100
  assert.equal(e.investment, 1000);
  assert.equal(e.stale, null);
  assert.equal(e.roi, 1);
  assert.ok(e.payoff.length > 0);
});

test("short straddle: unlimited loss has no investment", () => {
  const e = evaluate("short_straddle", calculateShortStraddle, company, row(), ctx)!;
  assert.equal(e.maxProfit, 1300); // (7 + 6) * 100
  assert.equal(e.maxLoss, null);
  assert.equal(e.investment, null);
});

test("stale: zero price always, old trade only while market is open", () => {
  assert.equal(evaluate("bull_call_spread", calculateBullCallSpread, company, row(NOW), ctx)!.stale, null);
  const old = row(NOW - 16 * 60_000);
  assert.equal(evaluate("bull_call_spread", calculateBullCallSpread, company, old, ctx)!.stale, "90CE");
  assert.equal(evaluate("bull_call_spread", calculateBullCallSpread, company, old, { ...ctx, marketOpen: false })!.stale, null);
  // 110C unpriced -> net debit no longer valid or leg stale; either way never reported as live
  const r = evaluate("bull_call_spread", calculateBullCallSpread, company, row(NOW, 0), ctx);
  assert.ok(r === null || r.stale !== null);
});

test("applyView: median Low/High split, hide stale, sort", () => {
  const mk = (symbol: string, investment: number | null, stale: string | null = null): Evaluation => ({
    k: symbol, symbol, name: symbol, expiry: "", lot: 1, spot: 1, maxProfit: investment, maxLoss: investment,
    investment, roi: null, breakevens: [], beDistancePct: null, stale, payoff: [],
  });
  const rows = [mk("A", 100), mk("B", 200), mk("C", 300), mk("D", 400), mk("E", 50, "stale"), mk("F", null)];
  const view: View = { investment: "all", min: null, max: null, hideStale: true, search: "", sort: "investment", dir: "asc" };
  assert.deepEqual(applyView(rows, view).map((r) => r.symbol), ["A", "B", "C", "D", "F"]);
  assert.deepEqual(applyView(rows, { ...view, investment: "low" }).map((r) => r.symbol), ["A", "B"]);
  assert.deepEqual(applyView(rows, { ...view, investment: "high" }).map((r) => r.symbol), ["C", "D"]);
  assert.deepEqual(applyView(rows, { ...view, dir: "desc" }).map((r) => r.symbol), ["F", "D", "C", "B", "A"]);
  assert.deepEqual(applyView(rows, { ...view, min: 150 }).map((r) => r.symbol), ["B", "C", "D"]);
});
