import { gunzipSync } from "node:zlib";

const INSTRUMENTS_URL =
  "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz";

/** Strikes on each side of ATM that get live prices (strategies read at most ATM +/- 2). */
export const WINDOW = 3;

const istDate = (ms) => new Date(ms + 5.5 * 3600e3).toISOString().slice(0, 10);

/**
 * One entry per NSE derivative underlying, using its nearest unexpired expiry.
 * Map<underlying_key, { key, symbol, name, expiry, lot, strikes: [{ strike, ce, pe }] }>
 */
export function buildUniverse(instruments, now = Date.now()) {
  const groups = new Map();
  for (const i of instruments) {
    if (i.segment !== "NSE_FO" || (i.instrument_type !== "CE" && i.instrument_type !== "PE") || i.expiry < now) continue;
    const g = groups.get(i.underlying_key);
    if (!g) groups.set(i.underlying_key, [i]);
    else g.push(i);
  }

  const universe = new Map();
  for (const [key, items] of groups) {
    const expiry = Math.min(...items.map((i) => i.expiry));
    const byStrike = new Map();
    let first;
    for (const i of items) {
      if (i.expiry !== expiry) continue;
      first ??= i;
      const s = byStrike.get(i.strike_price) ?? { strike: i.strike_price };
      s[i.instrument_type === "CE" ? "ce" : "pe"] = i.instrument_key;
      byStrike.set(i.strike_price, s);
    }
    const strikes = [...byStrike.values()].filter((s) => s.ce && s.pe).sort((a, b) => a.strike - b.strike);
    if (!strikes.length) continue;
    universe.set(key, {
      key,
      symbol: first.underlying_symbol ?? first.name,
      name: first.name,
      expiry: istDate(expiry),
      lot: first.lot_size,
      strikes,
    });
  }
  return universe;
}

export async function loadUniverse() {
  const res = await fetch(INSTRUMENTS_URL);
  if (!res.ok) throw new Error(`instruments download failed: ${res.status}`);
  return buildUniverse(JSON.parse(gunzipSync(Buffer.from(await res.arrayBuffer()))));
}

/** Index of the strike closest to spot (same rule the strategy calculators use). */
export function atmIndex(strikes, spot) {
  let best = 0;
  for (let i = 1; i < strikes.length; i++) {
    if (Math.abs(strikes[i].strike - spot) < Math.abs(strikes[best].strike - spot)) best = i;
  }
  return best;
}

/** Strikes that should be live for a given ATM index. */
export function windowStrikes(strikes, atm, each = WINDOW) {
  return strikes.slice(Math.max(0, atm - each), atm + each + 1);
}
