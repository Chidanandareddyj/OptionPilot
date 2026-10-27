/** React Query keys. Prefix keys let one `invalidateQueries` refresh a whole family. */
export const analysisKey = (id: string) => ["analysis", id] as const;
export const ANALYSES_KEY = ["analyses"] as const;
/** The History tab's pages. It sits under `ANALYSES_KEY`, so invalidating that refreshes it too. */
export const HISTORY_KEY = ["analyses", "history"] as const;
export const indicesKey = ["market", "indices"] as const;
export const quotesKey = (symbols: string[]) => ["market", "quotes", ...symbols] as const;
