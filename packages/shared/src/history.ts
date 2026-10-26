import { parseStoredDecision } from "./analysis";
import { STRATEGY_DEFINITIONS } from "./types";

export const ANALYSIS_PAGE_SIZE = 20;

export type AnalysisSummary = {
  id: string;
  company: string;
  spot: number | null;
  tag: string;
  createdAt: string;
};

export type AnalysisDetail = AnalysisSummary & {
  result: unknown;
  decision: unknown;
  updatedAt: string;
};

export type AnalysisCursor = {
  createdAt: Date;
  id: string;
};

export function analysisSpot(result: unknown): number | null {
  if (!result || typeof result !== "object") return null;
  const record = result as Record<string, unknown>;
  if (typeof record.underlying_spot_price === "number") return record.underlying_spot_price;
  if (typeof record.spot_price === "number") return record.spot_price;
  return null;
}

// Same tag the web history sheet shows: "view · strategy", "Compare view", or "12 strategies".
export function analysisTag(decision: unknown): string {
  const stored = parseStoredDecision(decision);
  const single =
    stored.mode === "single" && stored.single && typeof stored.single === "object"
      ? (stored.single as { view?: unknown; best?: { key?: unknown } | null })
      : null;
  const view = typeof single?.view === "string" ? single.view : null;
  const bestKey = typeof single?.best?.key === "string" ? single.best.key : null;
  const bestName = bestKey ? (STRATEGY_DEFINITIONS[bestKey]?.name ?? bestKey) : null;
  if (bestName && view) return `${view} · ${bestName}`;
  if (stored.mode === "compare") return "Compare view";
  return "12 strategies";
}

export function toAnalysisSummary(row: {
  id: string;
  company: string;
  result: unknown;
  decision: unknown;
  createdAt: Date | string;
}): AnalysisSummary {
  const createdAt = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
  return {
    id: row.id,
    company: row.company,
    spot: analysisSpot(row.result),
    tag: analysisTag(row.decision),
    createdAt: createdAt.toISOString(),
  };
}

export function toAnalysisDetail(row: {
  id: string;
  company: string;
  result: unknown;
  decision: unknown;
  createdAt: Date | string;
  updatedAt: Date | string;
}): AnalysisDetail {
  const updatedAt = row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt);
  return {
    ...toAnalysisSummary(row),
    result: row.result,
    decision: row.decision,
    updatedAt: updatedAt.toISOString(),
  };
}

// Both users get a filter on their own userId. A cursor never drops that scope.
export function analysisListWhere(userId: string, cursor?: AnalysisCursor) {
  if (!cursor) return { userId };
  return {
    userId,
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { AND: [{ createdAt: cursor.createdAt }, { id: { lt: cursor.id } }] },
    ],
  };
}
