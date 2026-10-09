export async function getLotSize(underlying_key: string, expiry_date: string) {
  const response = await fetch(
    `https://api.upstox.com/v2/option/contract?${new URLSearchParams({ instrument_key: underlying_key, expiry_date })}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.UPSTOX_API_KEY}`,
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Upstox option contract failed: ${response.status}`);
  }
  const lotSize = (await response.json()).data?.[0]?.lot_size;
  if (!lotSize) {
    throw new Error(`No lot size found for ${underlying_key} ${expiry_date}`);
  }
  return lotSize as number;
}
