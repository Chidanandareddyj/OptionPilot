import axios from "axios";

export async function getInstrumentId(company: string) {
  const response = await axios.get(
    `https://api.upstox.com/v2/instruments/search?query=${encodeURIComponent(company)}&exchanges=NSE&segments=EQ&instrument_types=EQ`,
    {
      headers: {
        Authorization: `Bearer ${process.env.UPSTOX_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.data[0].instrument_key;
}