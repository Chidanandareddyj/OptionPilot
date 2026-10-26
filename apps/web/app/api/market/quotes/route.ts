import { UnauthorizedError, type MarketQuotesResponse } from "@optionpilot/shared";
import { getRequestUserId } from "@/lib/auth/request-user";
import { parseQuoteSymbols, quotesFromUpstox } from "@/lib/market-quotes";
import { getInstrumentId } from "@/upstoxservices/getInstrumentId";
import axios from "axios";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

// GET /api/market/quotes?symbols=RELIANCE,TCS,INFY
// Quotes for stocks only. Indices stay on /api/market/indices.
// With no Upstox key or a failed lookup the list is empty, never made-up prices.
export async function GET(request: Request) {
  try {
    await getRequestUserId(request);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[/api/market/quotes auth error]:", error);
    return NextResponse.json({ error: "Quotes error" }, { status: 500 });
  }

  const symbols = parseQuoteSymbols(new URL(request.url).searchParams.get("symbols"));
  if (!symbols) {
    return NextResponse.json({ error: "Ask for known F&O symbols, e.g. ?symbols=RELIANCE,TCS" }, { status: 400 });
  }

  const empty: MarketQuotesResponse = { quotes: [] };
  const apiKey = process.env.UPSTOX_API_KEY;
  if (!apiKey) return NextResponse.json(empty);

  try {
    const keys = (await Promise.all(symbols.map(equityKey))).filter((key): key is string => key !== null);
    if (keys.length === 0) return NextResponse.json(empty);

    const response = await axios.get("https://api.upstox.com/v2/market-quote/quotes", {
      params: { instrument_key: keys.join(",") },
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      timeout: 4000,
    });
    const body: MarketQuotesResponse = { quotes: quotesFromUpstox(symbols, response.data?.data) };
    return NextResponse.json(body, {
      headers: { "Cache-Control": "private, max-age=3" },
    });
  } catch (error) {
    console.error("[/api/market/quotes error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(empty);
  }
}
