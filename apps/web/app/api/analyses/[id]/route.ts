import { UnauthorizedError, toAnalysisDetail } from "@optionpilot/shared";
import { getRequestUserId } from "@/lib/auth/request-user";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function ownedAnalysis(request: Request, id: string) {
  const userId = await getRequestUserId(request);
  return prisma.analysis.findFirst({ where: { id, userId } });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const row = await ownedAnalysis(request, id);
    if (!row) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }
    return NextResponse.json(toAnalysisDetail(row));
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[/api/analyses/[id] error]:", error);
    return NextResponse.json({ error: "History error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getRequestUserId(request);
    const { id } = await params;
    const deleted = await prisma.analysis.deleteMany({ where: { id, userId } });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[/api/analyses/[id] delete error]:", error);
    return NextResponse.json({ error: "History error" }, { status: 500 });
  }
}
