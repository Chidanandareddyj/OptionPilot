import { checkIsMarketOpen, type IndexQuote, type MarketIndicesResponse } from "@optionpilot/shared";
import { NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

export async function GET() {
  const isLive = checkIsMarketOpen();

  // Baseline defaults in case Upstox is unreachable or unconfigured
  const fallback = {
    isLive,
    status: isLive ? ("OPEN" as const) : ("CLOSED" as const),
    timestamp: new Date().toISOString(),
    source: "fallback" as const,
    indices: {
      nifty: {
        symbol: "NIFTY 50",
        price: 22888.95,
        netChange: -257.2,
        percentChange: -1.11,
        close: 22888.95,
      },
      bankNifty: {
        symbol: "BANKNIFTY",
        price: 55488.1,
        netChange: -355.9,
        percentChange: -0.64,
        close: 55488.1,
      },
    },
  };

  const apiKey = process.env.UPSTOX_API_KEY;
  if (!apiKey) {
    return NextResponse.json(fallback);
  }

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
    if (!data) {
      return NextResponse.json(fallback);
    }

    const niftyRaw = data["NSE_INDEX:Nifty 50"];
    const bankRaw = data["NSE_INDEX:Nifty Bank"];

    const extractQuote = (raw: any, fallbackQuote: IndexQuote): IndexQuote => {
      if (!raw) return fallbackQuote;
      const price = Number(raw.last_price || raw.ohlc?.close || fallbackQuote.price);
      const netChange = typeof raw.net_change === "number" ? raw.net_change : fallbackQuote.netChange;
      const prevClose = price - netChange;
      const percentChange = prevClose > 0 ? (netChange / prevClose) * 100 : fallbackQuote.percentChange;
      const close = Number(raw.ohlc?.close || price);

      return {
        symbol: fallbackQuote.symbol,
        price,
        netChange: Number(netChange.toFixed(2)),
        percentChange: Number(percentChange.toFixed(2)),
        close,
      };
    };

    const result: MarketIndicesResponse = {
      isLive,
      status: isLive ? "OPEN" : "CLOSED",
      timestamp: new Date().toISOString(),
      source: niftyRaw && bankRaw ? "live" : "fallback",
      indices: {
        nifty: extractQuote(niftyRaw, fallback.indices.nifty),
        bankNifty: extractQuote(bankRaw, fallback.indices.bankNifty),
      },
    };

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=3, stale-while-revalidate=5",
      },
    });
  } catch (err: any) {
    console.error("[/api/market/indices error]:", err.message);
    return NextResponse.json(fallback);
  }
}
