import axios from "axios";

async function searchUpstoxInstruments(params: Record<string, string | number>) {
  try {
    const response = await axios.get(
      "https://api.upstox.com/v2/instruments/search",
      {
        params,
        headers: {
          Authorization: `Bearer ${process.env.UPSTOX_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );
    return response.data?.data;
  } catch {
    return null;
  }
}

export async function getInstrumentId(company: string) {
  const query = company.trim();

  // Try current_month first
  let instruments = await searchUpstoxInstruments({
    query,
    exchanges: "NSE",
    segments: "FO",
    instrument_types: "CE,PE",
    expiry: "current_month",
    atm_offset: 0,
  });

  // If current month contracts have expired or are unavailable, fall back to nearest active expiry
  if (!instruments?.length) {
    instruments = await searchUpstoxInstruments({
      query,
      exchanges: "NSE",
      segments: "FO",
      instrument_types: "CE,PE",
      atm_offset: 0,
    });
  }

  // If still not found, try without atm_offset constraint
  if (!instruments?.length) {
    instruments = await searchUpstoxInstruments({
      query,
      exchanges: "NSE",
      segments: "FO",
      instrument_types: "CE,PE",
    });
  }

  if (!instruments?.length) {
    throw new Error(`No instruments found for "${company}"`);
  }

  return instruments;
}
