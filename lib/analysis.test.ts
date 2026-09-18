import assert from "node:assert/strict";
import test from "node:test";
import { parseCompany, requireUserId, toAnalysisRow, UnauthorizedError } from "./analysis.ts";

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
