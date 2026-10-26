import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "@testing-library/react-native";
import type { AnalysisDetail, AnalysisSummary, MarketIndicesResponse, MarketQuote } from "@optionpilot/shared";
import type { ReactElement } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AnalyzeFlowProvider } from "@/lib/analysis/AnalyzeFlow";
import { analysisResult } from "./fixtures/analysis";
import { renderThemed } from "./test-utils";

// Requests still in flight when a test ends answer through React Query's timers. Let them land inside act.
afterEach(async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});

/** What a route answers: a JSON body, or a ready Response for error cases. */
type Answer = unknown | Response | (() => unknown | Response | Promise<unknown | Response>);

/**
 * An `apiFetch` stand-in that answers by "METHOD /path" (the query string is ignored), and records
 * each call. Anything not listed is a 404.
 */
export function fakeApi(routes: Record<string, Answer>) {
  const calls: { method: string; path: string; init?: RequestInit }[] = [];
  const apiFetch = jest.fn(async (path: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push({ method, path, init });
    const route = routes[`${method} ${path.split("?")[0]}`];
    if (route === undefined) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }
    const answer = typeof route === "function" ? await (route as () => unknown)() : route;
    return answer instanceof Response ? answer : new Response(JSON.stringify(answer), { status: 200 });
  });
  return { apiFetch, calls };
}

export const failure = (status: number, error: string) => new Response(JSON.stringify({ error }), { status });

/** Renders a screen with the theme, a fresh query cache and the analyze flow, as the signed-in layout does, under the gesture root the app has. */
export function renderApp(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  return renderThemed(
    <QueryClientProvider client={client}>
      <GestureHandlerRootView>
        <AnalyzeFlowProvider>{ui}</AnalyzeFlowProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>,
  );
}

export const INDICES: MarketIndicesResponse = {
  isLive: true,
  status: "OPEN",
  timestamp: "2026-10-26T09:45:00.000Z",
  source: "live",
  indices: {
    nifty: { symbol: "NIFTY", price: 24500.5, netChange: 120, percentChange: 0.49, close: 24380.5 },
    bankNifty: { symbol: "BANKNIFTY", price: 53100, netChange: -80, percentChange: -0.15, close: 53180 },
  },
};

export const QUOTES: MarketQuote[] = [
  { symbol: "RELIANCE", price: 1190, netChange: 12, percentChange: 1.02, close: 1178 },
  { symbol: "TCS", price: 3500, netChange: -35, percentChange: -0.99, close: 3535 },
  { symbol: "INFY", price: 1500, netChange: 3, percentChange: 0.2, close: 1497 },
];

export const SUMMARY: AnalysisSummary = {
  id: "an-1",
  company: "RELIANCE",
  spot: 1190,
  tag: "Bullish · Bull Call Spread",
  createdAt: "2026-10-26T04:00:00.000Z",
};

export const DETAIL: AnalysisDetail = {
  ...SUMMARY,
  updatedAt: SUMMARY.createdAt,
  result: analysisResult(),
  decision: null,
};
