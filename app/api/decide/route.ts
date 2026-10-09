import { getDailyCloses } from "@/upstoxservices/getDailyCloses";
import { getLotSize } from "@/upstoxservices/getLotSize";
import { getOptions } from "@/upstoxservices/getOptions";

import { BadRequestError, parseDecideInput, requireUserId, UnauthorizedError } from "@/lib/analysis";
import { expiryMsLeft, rankDecision, scoreStrategies } from "@/lib/decision";
import { explainDecision } from "@/lib/explain";
import { askMercury } from "@/lib/mercury";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { data: session } = await auth.getSession();
    const userId = requireUserId(session);

    const { analysisId, view, maxLoss } = parseDecideInput(await request.json().catch(() => null));

    const analysis = await prisma.analysis.findFirst({ where: { id: analysisId, userId } });
    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    const result = analysis.result as Record<string, unknown>;
    const { underlying_key, expiry_date } = result;
    if (typeof underlying_key !== "string" || typeof expiry_date !== "string") {
      throw new Error("Analysis is missing underlying_key or expiry_date");
    }
    if (expiryMsLeft(expiry_date) <= 0) {
      throw new BadRequestError(`Expiry ${expiry_date} has passed; run a new analysis`);
    }

    const [chain, lotSize, closes] = await Promise.all([
      getOptions(underlying_key, expiry_date),
      getLotSize(underlying_key, expiry_date),
      getDailyCloses(underlying_key).catch(() => []),
    ]);

    const scored = scoreStrategies({ result, chain, lotSize, closes, view, maxLoss });
    const llm = await askMercury(
      {
        ...scored.context,
        strategies: Object.fromEntries(
          scored.strategies.map(({ key, viable, reasons, metrics }) => [
            key,
            { quant_viable: viable, reasons, ...metrics, legs: undefined },
          ]),
        ),
      },
      scored.strategies.map(({ key }) => key),
    );
    const ranked = rankDecision(scored, llm);
    const decision = { ...ranked, summary: await explainDecision(ranked) };

    await prisma.analysis.update({
      where: { id: analysis.id },
      data: { decision: decision as Prisma.InputJsonValue },
    });

    return NextResponse.json(decision);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
