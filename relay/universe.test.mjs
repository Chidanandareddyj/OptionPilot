import assert from "node:assert/strict";
import test from "node:test";
import { atmIndex, buildUniverse, windowStrikes } from "./universe.mjs";

const opt = (type, strike, expiry, extra = {}) => ({
  segment: "NSE_FO",
  instrument_type: type,
  underlying_key: "NSE_EQ|X",
  underlying_symbol: "X",
  name: "X",
  lot_size: 50,
  strike_price: strike,
  expiry,
  instrument_key: `NSE_FO|${type}${strike}${expiry}`,
  ...extra,
});

test("buildUniverse keeps nearest unexpired expiry and complete CE/PE strikes only", () => {
  const now = 1000;
  const u = buildUniverse(
    [
      opt("CE", 100, 500), // expired
      opt("CE", 100, 2000), opt("PE", 100, 2000),
      opt("CE", 110, 2000), // no PE -> dropped
      opt("CE", 90, 3000), opt("PE", 90, 3000), // later expiry
      { ...opt("CE", 1, 2000), segment: "NSE_EQ" },
    ],
    now,
  );
  const x = u.get("NSE_EQ|X");
  assert.deepEqual(x.strikes.map((s) => s.strike), [100]);
  assert.equal(x.lot, 50);
});

test("atmIndex and windowStrikes", () => {
  const strikes = Array.from({ length: 20 }, (_, i) => ({ strike: 100 + i * 10 }));
  const atm = atmIndex(strikes, 154);
  assert.equal(strikes[atm].strike, 150);
  assert.equal(windowStrikes(strikes, atm).length, 7);
  assert.equal(windowStrikes(strikes, 0).length, 4);
});
