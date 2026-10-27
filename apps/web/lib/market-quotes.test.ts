import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_QUOTE_SYMBOLS, parseQuoteSymbols, quotesFromUpstox, toMarketQuote } from "./market-quotes.ts";

test("parseQuoteSymbols keeps known symbols, upper-cased and de-duplicated", () => {
  assert.deepEqual(parseQuoteSymbols("reliance, TCS ,RELIANCE,infy"), ["RELIANCE", "TCS", "INFY"]);
});

test("parseQuoteSymbols drops unknown symbols and returns null when none are left", () => {
  assert.deepEqual(parseQuoteSymbols("TCS,NOTASYMBOL"), ["TCS"]);
  assert.equal(parseQuoteSymbols("NOTASYMBOL,,"), null);
  assert.equal(parseQuoteSymbols(""), null);
  assert.equal(parseQuoteSymbols(null), null);
});

test("parseQuoteSymbols caps the list", () => {
  const many = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "ITC", "LT", "AXISBANK", "MARUTI", "SUNPHARMA", "TATASTEEL"];
  assert.equal(parseQuoteSymbols(many.join(","))?.length, MAX_QUOTE_SYMBOLS);
});

test("toMarketQuote computes the percent change against the previous close", () => {
  const quote = toMarketQuote("RELIANCE", { last_price: 1190, net_change: 5, ohlc: { close: 1185 } });
  assert.deepEqual(quote, { symbol: "RELIANCE", price: 1190, netChange: 5, percentChange: 0.42, close: 1185 });
});

test("toMarketQuote handles a negative change and a missing close", () => {
  const quote = toMarketQuote("TCS", { last_price: 3842.1, net_change: -24.6 });
  assert.equal(quote?.percentChange, -0.64);
  assert.equal(quote?.close, 3842.1);
});

test("toMarketQuote rejects a quote with no usable price", () => {
  assert.equal(toMarketQuote("TCS", null), null);
  assert.equal(toMarketQuote("TCS", {}), null);
  assert.equal(toMarketQuote("TCS", { last_price: 0 }), null);
  assert.equal(toMarketQuote("TCS", { last_price: "abc" }), null);
});

test("quotesFromUpstox reads NSE_EQ keys in the asked order and skips missing ones", () => {
  const quotes = quotesFromUpstox(["TCS", "INFY", "SBIN"], {
    "NSE_EQ:INFY": { last_price: 1512.4, net_change: -5.8 },
    "NSE_EQ:TCS": { last_price: 3842.1, net_change: 24.5 },
  });
  assert.deepEqual(
    quotes.map((quote) => quote.symbol),
    ["TCS", "INFY"],
  );
});

test("quotesFromUpstox returns an empty list when Upstox sends no data", () => {
  assert.deepEqual(quotesFromUpstox(["TCS"], undefined), []);
  assert.deepEqual(quotesFromUpstox(["TCS"], null), []);
});
