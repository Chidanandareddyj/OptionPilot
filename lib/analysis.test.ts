import assert from "node:assert/strict";
import test from "node:test";
import {
  BadRequestError,
  mergeCompareDecision,
  parseCompany,
  parseDecideInput,
  parseStoredDecision,
  requireUserId,
  toAnalysisRow,
  UnauthorizedError,
} from "./analysis.ts";

test("requireUserId rejects missing sessions", () => {
  assert.throws(() => requireUserId(null), UnauthorizedError);
  assert.throws(() => requireUserId({ user: null }), UnauthorizedError);
  assert.equal(requireUserId({ user: { id: "user_1" } }), "user_1");
});

test("parseCompany requires a non-empty company", () => {
  assert.throws(() => parseCompany({}), /Company is required/);
  assert.throws(() => parseCompany({ company: "  " }), /Company is required/);
  assert.equal(parseCompany({ company: " RELIANCE " }), "RELIANCE");
});

test("toAnalysisRow stores the complete snapshot for that user", () => {
  const result = { long_straddle: { net: 1 }, short_strangle: { net: 2 } };
  assert.deepEqual(toAnalysisRow("user_1", "RELIANCE", result), {
    userId: "user_1",
    company: "RELIANCE",
    result,
  });
});

const decideBody = { analysisId: " a1 ", view: "bullish", maxLoss: 20000 };

test("parseDecideInput trims analysisId and omits pane by default", () => {
  assert.deepEqual(parseDecideInput(decideBody), {
    analysisId: "a1",
    view: "bullish",
    maxLoss: 20000,
    pane: undefined,
  });
});

test("parseDecideInput accepts left or right pane", () => {
  assert.equal(parseDecideInput({ ...decideBody, pane: "left" }).pane, "left");
  assert.equal(parseDecideInput({ ...decideBody, pane: "right" }).pane, "right");
});

test("parseDecideInput rejects an invalid pane", () => {
  assert.throws(() => parseDecideInput({ ...decideBody, pane: "middle" }), BadRequestError);
});

test("parseStoredDecision treats a legacy decision as single", () => {
  const legacy = { view: "neutral", strategies: [{ key: "iron_condor" }] };
  assert.deepEqual(parseStoredDecision(legacy), { mode: "single", single: legacy });
});

test("parseStoredDecision reads a compare wrapper", () => {
  const left = { view: "bullish" };
  const right = { view: "bearish" };
  assert.deepEqual(parseStoredDecision({ compare: true, left, right }), {
    mode: "compare",
    left,
    right,
  });
});

test("mergeCompareDecision preserves the other pane", () => {
  const left = { view: "bullish" };
  const right = { view: "bearish" };
  assert.deepEqual(mergeCompareDecision({ compare: true, left, right: null }, "right", right), {
    compare: true,
    left,
    right,
  });
});

test("mergeCompareDecision seeds the opposite pane from a legacy decision", () => {
  const legacy = { view: "neutral" };
  const left = { view: "bullish" };
  assert.deepEqual(mergeCompareDecision(legacy, "left", left), {
    compare: true,
    left,
    right: legacy,
  });
});
