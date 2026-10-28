import test from "node:test";
import assert from "node:assert/strict";
import { askDecision, askMercury } from "./mercury";

test("askDecision and askMercury are identical references", () => {
  assert.equal(askDecision, askMercury);
});

test("returns null when keys list is empty", async () => {
  const result = await askDecision({ spot: 24000 }, []);
  assert.equal(result, null);
});

test("returns null when OPENROUTER_API_KEY is not set", async () => {
  const origKey = process.env.OPENROUTER_API_KEY;
  try {
    delete process.env.OPENROUTER_API_KEY;
    const result = await askDecision({ spot: 24000 }, ["bull_call_spread"]);
    assert.equal(result, null);
  } finally {
    if (origKey !== undefined) {
      process.env.OPENROUTER_API_KEY = origKey;
    }
  }
});
