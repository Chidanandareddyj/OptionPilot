import assert from "node:assert/strict";
import test from "node:test";
import { analysisListWhere, analysisSpot, analysisTag, toAnalysisSummary } from "./history.ts";

test("analysisTag uses the view and the strategy name", () => {
  assert.equal(
    analysisTag({ view: "bullish", best: { key: "bull_call_spread" } }),
    "bullish · Bull Call Spread",
  );
});

test("analysisTag keeps an unknown strategy key", () => {
  assert.equal(analysisTag({ view: "neutral", best: { key: "custom" } }), "neutral · custom");
});

test("analysisTag labels a compare decision", () => {
  assert.equal(analysisTag({ compare: true, left: null, right: null }), "Compare view");
});

test("analysisTag falls back when nothing was decided", () => {
  assert.equal(analysisTag(null), "12 strategies");
  assert.equal(analysisTag({ view: "bullish" }), "12 strategies");
});

test("analysisSpot reads the stored underlying price", () => {
  assert.equal(analysisSpot({ underlying_spot_price: 1188.6 }), 1188.6);
  assert.equal(analysisSpot({ spot_price: 100 }), 100);
  assert.equal(analysisSpot({ underlying_spot_price: "1188" }), null);
  assert.equal(analysisSpot(null), null);
});

test("toAnalysisSummary serializes the list row", () => {
  const summary = toAnalysisSummary({
    id: "an_1",
    company: "RELIANCE",
    result: { underlying_spot_price: 1188.6 },
    decision: { view: "bullish", best: { key: "bull_call_spread" } },
    createdAt: new Date("2026-10-26T09:15:00.000Z"),
  });
  assert.deepEqual(summary, {
    id: "an_1",
    company: "RELIANCE",
    spot: 1188.6,
    tag: "bullish · Bull Call Spread",
    createdAt: "2026-10-26T09:15:00.000Z",
  });
});

test("analysisListWhere keeps each user inside their own rows", () => {
  const cursor = { createdAt: new Date("2026-10-26T09:15:00.000Z"), id: "an_2" };
  const alice = analysisListWhere("alice", cursor);
  const bob = analysisListWhere("bob", cursor);
  assert.equal(alice.userId, "alice");
  assert.equal(bob.userId, "bob");
  assert.notEqual(alice.userId, bob.userId);
  assert.deepEqual(alice.OR, bob.OR);
  assert.deepEqual(analysisListWhere("alice"), { userId: "alice" });
});
