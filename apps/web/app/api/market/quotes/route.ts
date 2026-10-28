import { UnauthorizedError, type MarketQuotesResponse } from "@optionpilot/shared";
import { getRequestUserId } from "@/lib/auth/request-user";
import { equityQuotes } from "@/lib/equity-quotes";
import { parseQuoteSymbols } from "@/lib/market-quotes";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

  const body: MarketQuotesResponse = { quotes: await equityQuotes(symbols) };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, max-age=3" },
  });
}
