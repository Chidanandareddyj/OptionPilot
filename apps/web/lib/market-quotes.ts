import { NSE_FO_SYMBOLS, type MarketQuote } from "@optionpilot/shared";

// Most symbols one request may ask for. Recent symbols on the terminal shows five.
export const MAX_QUOTE_SYMBOLS = 10;

const KNOWN_SYMBOLS = new Set(NSE_FO_SYMBOLS.map((entry) => entry.symbol));

/** Parses `?symbols=RELIANCE,TCS`. Returns null when nothing usable is asked for. */
export function parseQuoteSymbols(raw: string | null): string[] | null {
  if (!raw) return null;
  const symbols = new Set<string>();
  for (const part of raw.split(",")) {
    const symbol = part.trim().toUpperCase();
    if (KNOWN_SYMBOLS.has(symbol)) symbols.add(symbol);
  }
  if (symbols.size === 0) return null;
  return [...symbols].slice(0, MAX_QUOTE_SYMBOLS);
}

type RawQuote = {
  symbol?: unknown;
  last_price?: unknown;
  net_change?: unknown;
  ohlc?: { close?: unknown } | null;
};

/** Turns one Upstox full-quote entry into the app's quote. Same maths as `/api/market/indices`. */
export function toMarketQuote(symbol: string, raw: RawQuote | null | undefined): MarketQuote | null {
  if (!raw) return null;
  const price = Number(raw.last_price);
  if (!Number.isFinite(price) || price <= 0) return null;
  const netChange = typeof raw.net_change === "number" ? raw.net_change : 0;
  const prevClose = price - netChange;
  const percentChange = prevClose > 0 ? (netChange / prevClose) * 100 : 0;
  const close = Number(raw.ohlc?.close);
  return {
    symbol,
    price,
    netChange: Number(netChange.toFixed(2)),
    percentChange: Number(percentChange.toFixed(2)),
    close: Number.isFinite(close) && close > 0 ? close : price,
  };
}

/** Upstox keys the quote map as `NSE_EQ:<trading symbol>`. */
export function quotesFromUpstox(
  symbols: string[],
  data: Record<string, RawQuote> | null | undefined,
): MarketQuote[] {
  if (!data) return [];
  const quotes: MarketQuote[] = [];
  for (const symbol of symbols) {
    const quote = toMarketQuote(symbol, data[`NSE_EQ:${symbol}`]);
    if (quote) quotes.push(quote);
  }
  return quotes;
}
