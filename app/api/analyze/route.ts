import { getAtmStrike } from "@/upstoxservices/getAtmStrike";
import { getInstrumentId } from "@/upstoxservices/getInstrumentId";
import { getOptions } from "@/upstoxservices/getOptions";

import { calculateLongStraddle } from "@/strategies/LongStraddle";
import { calculateBullCallSpread } from "@/strategies/BullCallSpread";
import { calculateBullPutSpread } from "@/strategies/BullPutSpread";
import { calculateCallButterfly } from "@/strategies/CallButterfly";
import { calculatePutButterfly } from "@/strategies/PutButterfly";
import { calculateCallCondor } from "@/strategies/CallCondor";
import { calculatePutCondor } from "@/strategies/PutCondor";

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { company } = await request.json();

    const instruments = await getInstrumentId(company);

    const underlying_key =
      instruments[0]?.underlying_key;

    const expiry_date =
      instruments[0]?.expiry;

    if (!underlying_key || !expiry_date) {
      return NextResponse.json(
        { error: "No options found for this company" },
        { status: 404 },
      );
    }

    const options = await getOptions(
      underlying_key,
      expiry_date,
    );

    const atmStrike = getAtmStrike(options);

    if (!atmStrike) {
      return NextResponse.json(
        { error: "No option chain data found" },
        { status: 404 },
      );
    }

    // Long Straddle
    const longStraddle =
      calculateLongStraddle(options, 10);

    // Bull Call Spread
    const bullCallSpread =
      calculateBullCallSpread(options, 10);

    // Bull Put Spread
    const bullPutSpread =
      calculateBullPutSpread(options, 10);

    // Call Butterfly
    const callButterfly =
      calculateCallButterfly(options, 10);

    // Put Butterfly
    const putButterfly =
      calculatePutButterfly(options, 10);

    // Call Condor
    const callCondor =
      calculateCallCondor(options, 10);

    // Put Condor
    const putCondor =
      calculatePutCondor(options, 10);

    return NextResponse.json({
      underlying_key,
      expiry_date,

      underlying_spot_price:
        atmStrike.underlying_spot_price,

      long_straddle:
        longStraddle,

      bull_call_spread:
        bullCallSpread,

      bull_put_spread:
        bullPutSpread,

      call_butterfly:
        callButterfly,

      put_butterfly:
        putButterfly,

      call_condor:
        callCondor,

      put_condor:
        putCondor,

      options:
        longStraddle.payoff_table,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 },
    );
  }
}