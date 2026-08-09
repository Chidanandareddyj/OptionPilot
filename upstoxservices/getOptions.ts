import axios from "axios";

export async function getOptions(instrument_id: string) {
  const response = await axios.get(
    `https://api.upstox.com/v2/option/chain?instrument_key=${instrument_id}&expiry_date=2026-08-25`,
    {
      headers: {
        Authorization: `Bearer ${process.env.UPSTOX_API_KEY}`,
        Accept: "application/json",
      },
    },
  );
  return response.data;
}