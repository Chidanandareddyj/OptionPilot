import { QUICK, type AnalysisSummary, type MarketIndicesResponse, type MarketQuote } from "@optionpilot/shared";

/** The two indices that always head Recent symbols. */
export const INDEX_SYMBOLS = ["NIFTY", "BANKNIFTY"] as const;

/** How many stocks sit under the indices. */
export const RECENT_STOCK_COUNT = 3;

export type QuoteRowData = {
  symbol: string;
  /** Null while the price has not loaded, or when the server had none for the symbol. */
  price: number | null;
  percentChange: number | null;
};

const isIndex = (symbol: string) => (INDEX_SYMBOLS as readonly string[]).includes(symbol);

/**
 * The stocks to list: the ones analysed most recently, then the quick-access symbols until there
 * are enough. The history list is newest first.
 */
export function recentStockSymbols(history: AnalysisSummary[], count = RECENT_STOCK_COUNT): string[] {
  const picked: string[] = [];
  const add = (raw: string) => {
    const symbol = raw.trim().toUpperCase();
    if (symbol && !isIndex(symbol) && !picked.includes(symbol) && picked.length < count) picked.push(symbol);
  };
  history.forEach((item) => add(item.company));
  QUICK.forEach(add);
  return picked;
}

export function buildRecentRows(
  indices: MarketIndicesResponse | undefined,
  quotes: MarketQuote[] | undefined,
  stocks: string[],
): QuoteRowData[] {
  const bySymbol = new Map((quotes ?? []).map((quote) => [quote.symbol, quote]));
  const index = (symbol: string, quote: MarketIndicesResponse["indices"]["nifty"] | undefined): QuoteRowData => ({
    symbol,
    price: quote?.price ?? null,
    percentChange: quote?.percentChange ?? null,
  });
  return [
    index("NIFTY", indices?.indices.nifty),
    index("BANKNIFTY", indices?.indices.bankNifty),
    ...stocks.map((symbol) => ({
      symbol,
      price: bySymbol.get(symbol)?.price ?? null,
      percentChange: bySymbol.get(symbol)?.percentChange ?? null,
    })),
  ];
}
