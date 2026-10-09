const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// Newest first, as Upstox returns them.
export async function getDailyCloses(instrument_key: string, days = 45) {
  const now = Date.now();
  const response = await fetch(
    `https://api.upstox.com/v3/historical-candle/${encodeURIComponent(instrument_key)}/days/1/${isoDate(now)}/${isoDate(now - days * 864e5)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.UPSTOX_API_KEY}`,
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Upstox historical candles failed: ${response.status}`);
  }
  const candles: number[][] = (await response.json()).data?.candles ?? [];
  return candles.map((candle) => candle[4]);
}
