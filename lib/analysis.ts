export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

export const VIEWS = ["bullish", "bearish", "neutral", "volatile"] as const;
export type View = (typeof VIEWS)[number];

export function requireUserId(session: { user?: { id?: string } | null } | null | undefined) {
  const userId = session?.user?.id;
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

export function parseCompany(body: unknown) {
  if (!body || typeof body !== "object" || !("company" in body)) {
    throw new Error("Company is required");
  }
  const company = (body as { company: unknown }).company;
  if (typeof company !== "string" || !company.trim()) {
    throw new Error("Company is required");
  }
  return company.trim();
}

export function parseDecideInput(body: unknown) {
  const { analysisId, view, maxLoss } = (body ?? {}) as Record<string, unknown>;
  if (typeof analysisId !== "string" || !analysisId.trim()) {
    throw new BadRequestError("analysisId is required");
  }
  if (!VIEWS.includes(view as View)) {
    throw new BadRequestError(`view must be one of ${VIEWS.join(", ")}`);
  }
  if (typeof maxLoss !== "number" || !Number.isFinite(maxLoss) || maxLoss <= 0) {
    throw new BadRequestError("maxLoss must be a positive number of rupees");
  }
  return { analysisId: analysisId.trim(), view: view as View, maxLoss };
}

export function toAnalysisRow(userId: string, company: string, result: unknown) {
  return {
    userId,
    company,
    result,
  };
}
