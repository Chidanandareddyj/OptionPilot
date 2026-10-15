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

export const PANES = ["left", "right"] as const;
export type Pane = (typeof PANES)[number];

export type CompareDecision = {
  compare: true;
  left: unknown | null;
  right: unknown | null;
};

export type StoredDecision =
  | { mode: "single"; single: unknown | null }
  | { mode: "compare"; left: unknown | null; right: unknown | null };

export function isCompareDecision(value: unknown): value is CompareDecision {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return record.compare === true && "left" in record && "right" in record;
}

export function parseStoredDecision(value: unknown): StoredDecision {
  if (isCompareDecision(value)) {
    return { mode: "compare", left: value.left ?? null, right: value.right ?? null };
  }
  if (value && typeof value === "object") {
    return { mode: "single", single: value };
  }
  return { mode: "single", single: null };
}

export function mergeCompareDecision(existing: unknown, pane: Pane, decision: unknown): CompareDecision {
  const current = isCompareDecision(existing)
    ? { left: existing.left ?? null, right: existing.right ?? null }
    : existing && typeof existing === "object"
      ? pane === "left"
        ? { left: null, right: existing }
        : { left: existing, right: null }
      : { left: null, right: null };

  return {
    compare: true,
    left: pane === "left" ? decision : current.left,
    right: pane === "right" ? decision : current.right,
  };
}

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
  const { analysisId, view, maxLoss, pane } = (body ?? {}) as Record<string, unknown>;
  if (typeof analysisId !== "string" || !analysisId.trim()) {
    throw new BadRequestError("analysisId is required");
  }
  if (!VIEWS.includes(view as View)) {
    throw new BadRequestError(`view must be one of ${VIEWS.join(", ")}`);
  }
  if (typeof maxLoss !== "number" || !Number.isFinite(maxLoss) || maxLoss <= 0) {
    throw new BadRequestError("maxLoss must be a positive number of rupees");
  }
  if (pane !== undefined && pane !== null && !PANES.includes(pane as Pane)) {
    throw new BadRequestError("pane must be left or right");
  }
  return {
    analysisId: analysisId.trim(),
    view: view as View,
    maxLoss,
    pane: PANES.includes(pane as Pane) ? (pane as Pane) : undefined,
  };
}

export function toAnalysisRow(userId: string, company: string, result: unknown) {
  return {
    userId,
    company,
    result,
  };
}
