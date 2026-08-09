import axios from "axios";

export async function getOptions(instrument_id: string) {
  const options = await axios.get(
    `https://api.upstox.com/v2/instruments/options?instrument_id=${instrument_id}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.UPSTOX_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );
  return options.data.instruments;
}