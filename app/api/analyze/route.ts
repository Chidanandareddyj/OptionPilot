import { getAtmStrike } from "@/upstoxservices/getAtmStrike";
import { getInstrumentId } from "@/upstoxservices/getInstrumentId";
import { getOptions } from "@/upstoxservices/getOptions";
import { calculateLongStraddle } from "@/strategies/LongStraddle";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { company } = await request.json();
    const instruments = await getInstrumentId(company);
    const underlying_key = instruments[0]?.underlying_key;
    const expiry_date = instruments[0]?.expiry;

    if (!underlying_key || !expiry_date) {
      return NextResponse.json(
        { error: "No options found for this company" },
        { status: 404 },
      );
    }

    const options = await getOptions(underlying_key, expiry_date);
    const atmStrike = getAtmStrike(options);

    if (!atmStrike) {
      return NextResponse.json(
        { error: "No option chain data found" },
        { status: 404 },
      );
    }

    const longStraddle = calculateLongStraddle(options, 10);
    console.log(longStraddle);
    return NextResponse.json({
      underlying_key,
      expiry_date,
      underlying_spot_price: atmStrike.underlying_spot_price,
      long_straddle: longStraddle,
      options: longStraddle.payoff_table,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
