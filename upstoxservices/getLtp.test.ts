import assert from "node:assert/strict";
import test from "node:test";
import { ltpPriceMap, normalizeLtpKey } from "./getLtp.ts";

test("normalizeLtpKey converts Upstox colon keys to pipe keys", () => {
  assert.equal(normalizeLtpKey("NSE_EQ:INE002A01018"), "NSE_EQ|INE002A01018");
  assert.equal(normalizeLtpKey("NSE_INDEX:Nifty 50"), "NSE_INDEX|Nifty 50");
  assert.equal(normalizeLtpKey("NSE_INDEX|Nifty 50"), "NSE_INDEX|Nifty 50");
});

test("ltpPriceMap indexes last_price by the request instrument key", () => {
  const prices = ltpPriceMap({
    "NSE_EQ:INE002A01018": { last_price: 2450.5, instrument_token: "NSE_EQ|INE002A01018" },
    "NSE_INDEX:Nifty 50": { last_price: 25000 },
  });
  assert.equal(prices.get("NSE_EQ|INE002A01018"), 2450.5);
  assert.equal(prices.get("NSE_INDEX|Nifty 50"), 25000);
});
