import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { analysisSpot, type AnalysisDetail } from "@optionpilot/shared";
import { useApi } from "@/lib/api/hooks";
import { analysisKey } from "@/lib/api/keys";
import { analysisErrorMessage } from "./errors";

type FlowState =
  | { status: "idle" }
  | { status: "running"; symbol: string }
  | { status: "done"; symbol: string; id: string }
  | { status: "failed"; symbol: string; message: string };

type AnalyzeFlow = {
  state: FlowState;
  /** The symbol typed into the Terminal search field. Kept here because the search sheet edits it too. */
  query: string;
  setQuery: (value: string) => void;
  /** Starts an analysis. Returns false when the symbol is empty. */
  start: (rawSymbol: string) => boolean;
  /** Forgets the outcome, and drops a run that is still going. */
  reset: () => void;
};

const Context = createContext<AnalyzeFlow | null>(null);

/**
 * Owns the one analysis that can be running. The Terminal starts it, the Calculating screen waits on
 * it, and a failure is handed back to the Terminal to show as an alert. The server answer for a
 * dropped run is ignored.
 */
export function AnalyzeFlowProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [state, setState] = useState<FlowState>({ status: "idle" });
  const [query, setQuery] = useState("");
  const run = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    run.current += 1;
    controller.current?.abort();
    controller.current = null;
    setState({ status: "idle" });
  }, []);

  const start = useCallback(
    (rawSymbol: string) => {
      const symbol = rawSymbol.trim().toUpperCase();
      if (!symbol) return false;
      run.current += 1;
      const mine = run.current;
      controller.current?.abort();
      controller.current = new AbortController();
      setState({ status: "running", symbol });

      api
        .analyze(symbol, controller.current.signal)
        .then(({ id, ...result }) => {
          if (run.current !== mine) return;
          const now = new Date().toISOString();
          // The detail screen reads the same cache, so a fresh analysis opens without another request.
          const detail: AnalysisDetail = {
            id,
            company: symbol,
            spot: analysisSpot(result),
            tag: "12 strategies",
            createdAt: now,
            updatedAt: now,
            result,
            decision: null,
          };
          queryClient.setQueryData(analysisKey(id), detail);
          void queryClient.invalidateQueries({ queryKey: ["analyses"] });
          setState({ status: "done", symbol, id });
        })
        .catch((error: unknown) => {
          if (run.current !== mine) return;
          setState({ status: "failed", symbol, message: analysisErrorMessage(error, symbol) });
        });
      return true;
    },
    [api, queryClient],
  );

  const value = useMemo(() => ({ state, query, setQuery, start, reset }), [state, query, start, reset]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAnalyzeFlow(): AnalyzeFlow {
  const value = useContext(Context);
  if (!value) throw new Error("useAnalyzeFlow must be used inside AnalyzeFlowProvider");
  return value;
}
