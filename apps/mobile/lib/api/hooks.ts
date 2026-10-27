import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { createApi, type Api } from "./client";
import { ANALYSES_KEY, analysisKey, indicesKey, quotesKey } from "./keys";

/** Prices refresh this often while the Terminal is on screen and the app is in front. */
export const PRICE_POLL_MS = 3000;

/** The API client for the signed-in session. */
export function useApi(): Api {
  const { apiFetch } = useAuth();
  return useMemo(() => createApi(apiFetch), [apiFetch]);
}

export function useIndices(options: { poll: boolean }) {
  const api = useApi();
  return useQuery({
    queryKey: indicesKey,
    queryFn: () => api.indices(),
    refetchInterval: options.poll ? PRICE_POLL_MS : false,
  });
}

export function useQuotes(symbols: string[], options: { poll: boolean }) {
  const api = useApi();
  return useQuery({
    queryKey: quotesKey(symbols),
    queryFn: () => api.quotes(symbols),
    enabled: symbols.length > 0,
    refetchInterval: options.poll ? PRICE_POLL_MS : false,
  });
}

export function useRecentAnalyses() {
  const api = useApi();
  return useQuery({ queryKey: ANALYSES_KEY, queryFn: () => api.recentAnalyses(), staleTime: 30_000 });
}

/** One saved analysis. Its result never changes, so it is fetched once per session. */
export function useAnalysis(id: string) {
  const api = useApi();
  return useQuery({ queryKey: analysisKey(id), queryFn: () => api.analysis(id), staleTime: Infinity });
}
