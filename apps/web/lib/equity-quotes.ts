import { type MarketQuote } from "@optionpilot/shared";
import axios from "axios";
import { getInstrumentId } from "@/upstoxservices/getInstrumentId";
import { MAX_QUOTE_SYMBOLS, quotesFromUpstox } from "./market-quotes";

// A stock's equity key (NSE_EQ|ISIN) is the underlying key of its option contracts.
// It does not change, so look it up once per server instance.
const equityKeys = new Map<string, string>();

async function equityKey(symbol: string): Promise<string | null> {
  const cached = equityKeys.get(symbol);
  if (cached) return cached;
  try {
    const instruments = await getInstrumentId(symbol);
    const key = instruments[0]?.underlying_key;
    if (typeof key !== "string" || !key.startsWith("NSE_EQ|")) return null;
    equityKeys.set(symbol, key);
    return key;
  } catch {
    return null;
  }
}

/**
 * Last quotes for stocks. Upstox takes a limited number of keys per call, so this batches.
 * A failed batch is skipped. With no API key the list is empty: prices are never invented.
 */
export async function equityQuotes(symbols: string[], apiKey = process.env.UPSTOX_API_KEY): Promise<MarketQuote[]> {
  if (!apiKey || symbols.length === 0) return [];
  const quotes: MarketQuote[] = [];
  for (let index = 0; index < symbols.length; index += MAX_QUOTE_SYMBOLS) {
    const batch = symbols.slice(index, index + MAX_QUOTE_SYMBOLS);
    try {
      const keys = (await Promise.all(batch.map(equityKey))).filter((key): key is string => key !== null);
      if (keys.length === 0) continue;
      const response = await axios.get("https://api.upstox.com/v2/market-quote/quotes", {
        params: { instrument_key: keys.join(",") },
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
        timeout: 4000,
      });
      quotes.push(...quotesFromUpstox(batch, response.data?.data));
    } catch (error) {
      console.error("[equity quotes error]:", error instanceof Error ? error.message : error);
    }
  }
  return quotes;
}
