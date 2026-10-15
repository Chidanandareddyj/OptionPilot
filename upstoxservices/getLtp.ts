import axios from "axios";

type LtpQuote = {
  last_price?: number;
  instrument_token?: string;
};

/** Upstox LTP response keys use `NSE_EQ:ISIN`; requests and option search use `NSE_EQ|ISIN`. */
export function normalizeLtpKey(key: string) {
  const separator = key.indexOf(":");
  if (separator === -1) return key;
  return `${key.slice(0, separator)}|${key.slice(separator + 1)}`;
}

export function ltpPriceMap(data: Record<string, LtpQuote> | null | undefined) {
  const prices = new Map<string, number>();
  if (!data) return prices;

  for (const [rawKey, quote] of Object.entries(data)) {
    if (typeof quote?.last_price !== "number" || !Number.isFinite(quote.last_price)) continue;
    prices.set(normalizeLtpKey(rawKey), quote.last_price);
    if (quote.instrument_token) prices.set(quote.instrument_token, quote.last_price);
  }

  return prices;
}

export async function getLtp(instrumentKeys: string[]) {
  const unique = [...new Set(instrumentKeys.map((key) => key.trim()).filter(Boolean))];
  if (unique.length === 0) return new Map<string, number>();

  const instrument_key = unique.map(encodeURIComponent).join(",");
  const response = await axios.get(
    `https://api.upstox.com/v2/market-quote/ltp?instrument_key=${instrument_key}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.UPSTOX_API_KEY}`,
        Accept: "application/json",
      },
    },
  );

  return ltpPriceMap(response.data?.data);
}
