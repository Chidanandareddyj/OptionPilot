import axios from "axios";

export async function getInstrumentId(company: string) {
  const response = await axios.get(
    "https://api.upstox.com/v2/instruments/search",
    {
      params: {
        query: company,
        exchanges: "NSE",
        segments: "FO",
        instrument_types: "CE,PE",
        expiry: "current_month",
        atm_offset: 0,
      },
      headers: {
        Authorization: `Bearer ${process.env.UPSTOX_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );
  const instruments = response.data.data;
  if (!instruments?.length) {
    throw new Error(`No instruments found for "${company}"`);
  }

  return instruments;
}