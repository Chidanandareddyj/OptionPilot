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
import { calculateBearCallSpread } from "@/strategies/BearCallSpread";
import { calculateBearPutSpread } from "@/strategies/BearPutSpread";
import { calculateLongStrangle } from "@/strategies/LongStrangle";
import { calculateShortStraddle } from "@/strategies/ShortStraddle";
import { calculateShortStrangle } from "@/strategies/ShortStrangle";

import { parseCompany, requireUserId, toAnalysisRow, UnauthorizedError } from "@/lib/analysis";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { data: session } = await auth.getSession();
    const userId = requireUserId(session);

    const company = parseCompany(await request.json());

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

    const result = {
      underlying_key,
      expiry_date,
      underlying_spot_price: atmStrike.underlying_spot_price,
      long_straddle: calculateLongStraddle(options, 10),
      bull_call_spread: calculateBullCallSpread(options, 10),
      bull_put_spread: calculateBullPutSpread(options, 10),
      call_butterfly: calculateCallButterfly(options, 10),
      put_butterfly: calculatePutButterfly(options, 10),
      call_condor: calculateCallCondor(options, 10),
      put_condor: calculatePutCondor(options, 10),
      bear_call_spread: calculateBearCallSpread(options, 10),
      bear_put_spread: calculateBearPutSpread(options, 10),
      long_strangle: calculateLongStrangle(options, 10),
      short_straddle: calculateShortStraddle(options, 10),
      short_strangle: calculateShortStrangle(options, 10),
    };
    const payload = {
      ...result,
      options: result.long_straddle.payoff_table,
    };

    await prisma.analysis.create({
      data: {
        ...toAnalysisRow(userId, company, payload),
        result: payload as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
