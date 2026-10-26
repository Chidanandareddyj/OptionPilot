import type { rankDecision } from "./decision";
import type { Pane, View } from "./analysis";

export type IndexQuote = {
  symbol: string;
  price: number;
  netChange: number;
  percentChange: number;
  close: number;
};

export type MarketIndicesResponse = {
  isLive: boolean;
  status: "OPEN" | "CLOSED";
  timestamp: string;
  indices: {
    nifty: IndexQuote;
    bankNifty: IndexQuote;
  };
  // Additive. "fallback" means the hard-coded prices, not a live Upstox quote.
  source: "live" | "fallback";
};

/**
 * One symbol quote. `GET /api/market/quotes` is a later phase.
 * Recent symbols on the terminal need this for stocks, not only the two indices.
 */
export type MarketQuote = {
  symbol: string;
  price: number;
  netChange: number;
  percentChange: number;
  close: number;
};

export type MarketQuotesResponse = {
  quotes: MarketQuote[];
};

export type AnalyzeResponse = {
  id: string;
  underlying_key: string;
  company_name?: string;
  expiry_date: string;
  lot_size: number;
  underlying_spot_price: number;
  options: unknown;
} & Record<string, unknown>;

export type DecideRequest = {
  analysisId: string;
  view: View;
  maxLoss: number;
  pane?: Pane;
};

export type Decision = ReturnType<typeof rankDecision> & { summary?: string | null };

export type DecideResponse = Decision;

export type RelayTokenResponse = {
  url: string;
  token: string;
};

export type Snapshot = {
  id?: string;
  company: string;
  createdAt?: Date;
  result: unknown;
  decision?: unknown;
};
