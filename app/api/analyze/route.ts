import { getAtmStrike } from "@/upstoxservices/getAtmStrike";
import { getInstrumentId } from "@/upstoxservices/getInstrumentId";
import { getOptions } from "@/upstoxservices/getOptions";
import { calculateLongStraddle } from "@/strategies/LongStraddle";
import { calculateIronCondor } from "@/strategies/IronCondor";
import { calculateButterflySpread } from "@/strategies/ButterflySpread";
import { calculateBullCallSpread } from "@/strategies/BullCallSpread";
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
    const ironCondor = calculateIronCondor(options, 2, 10);
    const butterflySpread = calculateButterflySpread(options, 10);
    const bullCallSpread = calculateBullCallSpread(options, 10);

    return NextResponse.json({
      underlying_key,
      expiry_date,
      underlying_spot_price: atmStrike.underlying_spot_price,
      long_straddle: longStraddle,
      iron_condor: ironCondor,
      butterfly_spread: butterflySpread,
      bull_call_spread: bullCallSpread,
      options: longStraddle.payoff_table,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 },
    );
  }
}