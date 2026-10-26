import { mergeCompareDecision, type AnalysisDetail, type DecideRequest } from "@optionpilot/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

/**
 * Scores one analysis. The server saves the result on the analysis, so the cached copy is updated
 * the same way (a pane's result joins the compare pair, a single result replaces it) and the
 * screens that read it show the new ranking at once.
 */
export function useDecide(analysisId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: Omit<DecideRequest, "analysisId">) => api.decide({ ...request, analysisId }),
    // Fail at once when offline, so the sheet can say so, rather than wait for the network.
    networkMode: "always",
    onSuccess: (decision, request) => {
      queryClient.setQueryData<AnalysisDetail>(analysisKey(analysisId), (saved) =>
        saved && { ...saved, decision: request.pane ? mergeCompareDecision(saved.decision, request.pane, decision) : decision },
      );
      void queryClient.invalidateQueries({ queryKey: ANALYSES_KEY });
    },
  });
}
