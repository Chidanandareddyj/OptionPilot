import axios from "axios";

export async function getOptions(underlying_key: string, expiry_date: string) {
  const response = await axios.get(
    `https://api.upstox.com/v2/option/chain?instrument_key=${encodeURIComponent(underlying_key)}&expiry_date=${encodeURIComponent(expiry_date)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.UPSTOX_API_KEY}`,
        Accept: "application/json",
      },
    },
  );
  return response.data;
}