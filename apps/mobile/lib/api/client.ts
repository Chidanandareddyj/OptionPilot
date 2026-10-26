import type {
  AnalysisDetail,
  AnalysisSummary,
  AnalyzeResponse,
  DecideRequest,
  DecideResponse,
  MarketIndicesResponse,
  MarketQuote,
  MarketQuotesResponse,
  RelayTokenResponse,
} from "@optionpilot/shared";

/** The server answered, but with an error status. `message` is the server's own text when it sent one. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiFetch = (path: string, init?: RequestInit) => Promise<Response>;

export type HistoryPage = { analyses: AnalysisSummary[]; nextCursor: string | null };

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

const errorText = (body: unknown): string | null =>
  body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string"
    ? (body as { error: string }).error
    : null;

/** The OptionPilot routes the Terminal uses, over the authenticated `apiFetch` from the session. */
export function createApi(apiFetch: ApiFetch) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await apiFetch(path, init);
    const body = await readJson(response);
    if (!response.ok) {
      throw new ApiError(errorText(body) ?? `The request failed (${response.status}).`, response.status);
    }
    return body as T;
  }

  return {
    indices: () => request<MarketIndicesResponse>("/api/market/indices"),

    async quotes(symbols: string[]): Promise<MarketQuote[]> {
      if (symbols.length === 0) return [];
      const query = encodeURIComponent(symbols.join(","));
      return (await request<MarketQuotesResponse>(`/api/market/quotes?symbols=${query}`)).quotes;
    },

    /** The newest page of the signed-in user's saved analyses. */
    async recentAnalyses(): Promise<AnalysisSummary[]> {
      return (await request<HistoryPage>("/api/analyses")).analyses;
    },

    /** One page of the saved analyses, newest first. Pass the previous page's `nextCursor` for the next one. */
    historyPage: (cursor?: string | null) =>
      request<HistoryPage>(cursor ? `/api/analyses?cursor=${encodeURIComponent(cursor)}` : "/api/analyses"),

    /** Deletes one saved analysis. A 404 means it is already gone, which is what was asked for. */
    async deleteAnalysis(id: string): Promise<void> {
      try {
        await request<unknown>(`/api/analyses/${encodeURIComponent(id)}`, { method: "DELETE" });
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 404)) throw error;
      }
    },

    /** A 60 second token and the address of the live price relay. Fetch a new one for every connection. */
    derivativesToken: () => request<RelayTokenResponse>("/api/derivatives/token"),

    analysis: (id: string) => request<AnalysisDetail>(`/api/analyses/${encodeURIComponent(id)}`),

    /** Runs the calculators for a symbol and saves the result. Slow: it queries the option chain. */
    analyze: (company: string, signal?: AbortSignal) =>
      request<AnalyzeResponse>("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ company }),
        signal,
      }),

    /** Scores the twelve strategies for a view and a loss budget, and saves the result on the analysis. */
    decide: (decision: DecideRequest) =>
      request<DecideResponse>("/api/decide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(decision),
      }),
  };
}

export type Api = ReturnType<typeof createApi>;
