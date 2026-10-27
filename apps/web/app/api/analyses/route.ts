import {
  ANALYSIS_PAGE_SIZE,
  UnauthorizedError,
  analysisListWhere,
  toAnalysisSummary,
  type AnalysisCursor,
} from "@optionpilot/shared";
import { getRequestUserId } from "@/lib/auth/request-user";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = await getRequestUserId(request);
    const cursorId = new URL(request.url).searchParams.get("cursor");
    let cursor: AnalysisCursor | undefined;
    if (cursorId) {
      const current = await prisma.analysis.findFirst({
        where: { id: cursorId, userId },
        select: { id: true, createdAt: true },
      });
      if (!current) {
        return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
      }
      cursor = current;
    }

    const rows = await prisma.analysis.findMany({
      where: analysisListWhere(userId, cursor),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: ANALYSIS_PAGE_SIZE + 1,
      select: { id: true, company: true, result: true, decision: true, createdAt: true },
    });
    const page = rows.slice(0, ANALYSIS_PAGE_SIZE);
    const last = page[page.length - 1];
    return NextResponse.json({
      analyses: page.map(toAnalysisSummary),
      nextCursor: rows.length > ANALYSIS_PAGE_SIZE && last ? last.id : null,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[/api/analyses error]:", error);
    return NextResponse.json({ error: "History error" }, { status: 500 });
  }
}
