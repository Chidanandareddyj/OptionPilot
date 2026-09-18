export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
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

export function toAnalysisRow(userId: string, company: string, result: unknown) {
  return {
    userId,
    company,
    result,
  };
}
