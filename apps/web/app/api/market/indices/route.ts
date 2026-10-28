import { checkIsMarketOpen, type IndexQuote, type MarketIndicesResponse } from "@optionpilot/shared";
import { NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

// In-memory cache for the last real market quotes fetched from Upstox.
// Persists across requests so that if Upstox is unreachable or markets are closed,
// the real last traded prices are returned instead of fake numbers.
let lastKnownIndices: {
  nifty: IndexQuote;
  bankNifty: IndexQuote;
} | null = null;
let lastKnownTimestamp: string | null = null;

function extractQuote(raw: any, symbol: string): IndexQuote | null {
  if (!raw) return null;
  const price = Number(raw.last_price || raw.ohlc?.close);
  if (!Number.isFinite(price) || price <= 0) return null;
  const netChange = typeof raw.net_change === "number" ? raw.net_change : 0;
  const prevClose = price - netChange;
  const percentChange = prevClose > 0 ? (netChange / prevClose) * 100 : 0;
  const close = Number(raw.ohlc?.close || price);

  return {
    symbol,
    price,
    netChange: Number(netChange.toFixed(2)),
    percentChange: Number(percentChange.toFixed(2)),
    close,
  };
}

export async function GET() {
  const isLive = checkIsMarketOpen();
  const apiKey = process.env.UPSTOX_API_KEY;

  if (apiKey) {
    try {
      const response = await axios.get("https://api.upstox.com/v2/market-quote/quotes", {
        params: {
          instrument_key: "NSE_INDEX|Nifty 50,NSE_INDEX|Nifty Bank",
        },
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        timeout: 4000,
      });

      const data = response.data?.data;
      if (data) {
        const niftyRaw = data["NSE_INDEX:Nifty 50"];
        const bankRaw = data["NSE_INDEX:Nifty Bank"];

        const nifty = extractQuote(niftyRaw, "NIFTY 50") ?? lastKnownIndices?.nifty ?? null;
        const bankNifty = extractQuote(bankRaw, "BANKNIFTY") ?? lastKnownIndices?.bankNifty ?? null;

        if (nifty && bankNifty) {
          lastKnownIndices = { nifty, bankNifty };
          lastKnownTimestamp = new Date().toISOString();

          const result: MarketIndicesResponse = {
            isLive,
            status: isLive ? "OPEN" : "CLOSED",
            timestamp: lastKnownTimestamp,
            source: isLive ? "live" : "cached",
            indices: { nifty, bankNifty },
          };

          return NextResponse.json(result, {
            headers: {
              "Cache-Control": isLive
                ? "public, s-maxage=3, stale-while-revalidate=5"
                : "public, s-maxage=60, stale-while-revalidate=120",
            },
          });
        }
      }
    } catch (err: any) {
      console.warn("[/api/market/indices fetch warning]:", err.message);
    }
  }

  // If live fetch failed or no API key, but we have last known real data in memory
  if (lastKnownIndices) {
    const cachedResult: MarketIndicesResponse = {
      isLive: false,
      status: isLive ? "OPEN" : "CLOSED",
      timestamp: lastKnownTimestamp ?? new Date().toISOString(),
      source: "cached",
      indices: lastKnownIndices,
    };
    return NextResponse.json(cachedResult, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  }

  // No real data has ever been fetched yet and live fetch failed
  return NextResponse.json(
    { error: "Market index quotes are currently unavailable" },
    { status: 503 },
  );
}
