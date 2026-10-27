/** React Query keys. Prefix keys let one `invalidateQueries` refresh a whole family. */
export const analysisKey = (id: string) => ["analysis", id] as const;
export const ANALYSES_KEY = ["analyses"] as const;
export const indicesKey = ["market", "indices"] as const;
export const quotesKey = (symbols: string[]) => ["market", "quotes", ...symbols] as const;
