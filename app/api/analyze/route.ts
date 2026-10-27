import { getAtmStrike } from "@/upstoxservices/getAtmStrike";
import { getInstrumentId } from "@/upstoxservices/getInstrumentId";
import { getLotSize } from "@/upstoxservices/getLotSize";
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

    const lot_size =
      typeof instruments[0]?.lot_size === "number" && instruments[0].lot_size > 0
        ? instruments[0].lot_size
        : await getLotSize(underlying_key, expiry_date).catch(() => 1);

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
      company_name: instruments[0]?.name,
      expiry_date,
      lot_size,
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

    const row = await prisma.analysis.create({
      data: {
        id: crypto.randomUUID(),
        ...toAnalysisRow(userId, company, payload),
        result: payload as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ ...payload, id: row.id });
  } catch (error) {
    console.error("[/api/analyze error]:", error);
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
