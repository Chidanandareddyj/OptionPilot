import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestError, parseCompany, parseSymbols, requireUserId, toAnalysisRow, UnauthorizedError } from "./analysis.ts";

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

test("parseSymbols accepts up to 8 trimmed symbols", () => {
  assert.deepEqual(parseSymbols({ symbols: [" RELIANCE ", "TCS"] }), ["RELIANCE", "TCS"]);
  assert.equal(parseSymbols({ symbols: ["A", "B", "C", "D", "E", "F", "G", "H"] }).length, 8);
});

test("parseSymbols rejects empty values and batches over 8", () => {
  assert.throws(() => parseSymbols({}), BadRequestError);
  assert.throws(() => parseSymbols({ symbols: [] }), /non-empty array/);
  assert.throws(() => parseSymbols({ symbols: ["  "] }), /non-empty strings/);
  assert.throws(() => parseSymbols({ symbols: [1] }), /non-empty strings/);
  assert.throws(() => parseSymbols({ symbols: ["A", "B", "C", "D", "E", "F", "G", "H", "I"] }), /limited to 8/);
});

test("toAnalysisRow stores the complete snapshot for that user", () => {
  const result = { long_straddle: { net: 1 }, short_strangle: { net: 2 } };
  assert.deepEqual(toAnalysisRow("user_1", "RELIANCE", result), {
    userId: "user_1",
    company: "RELIANCE",
    result,
  });
});
