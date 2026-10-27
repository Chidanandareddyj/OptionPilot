import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { initialCompareState, type AnalysisDetail } from "@optionpilot/shared";
import type { ReactNode } from "react";
import { analysisKey, ANALYSES_KEY } from "@/lib/api/keys";
import { useDecide } from "@/lib/api/hooks";
import { DETAIL, failure, fakeApi } from "./app-harness";
import { decide } from "./fixtures/decision";

let mockApiFetch: ReturnType<typeof fakeApi>["apiFetch"];
jest.mock("@/lib/auth", () => ({ useAuth: () => ({ apiFetch: (path: string, init?: RequestInit) => mockApiFetch(path, init) }) }));

async function setup(routes: Parameters<typeof fakeApi>[0]) {
  const api = fakeApi(routes);
  mockApiFetch = api.apiFetch;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  client.setQueryData(analysisKey("an-1"), DETAIL);
  const invalidate = jest.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const hook = await renderHook(() => useDecide("an-1"), { wrapper });
  const cached = () => client.getQueryData<AnalysisDetail>(analysisKey("an-1"))!;
  return { api, hook, cached, invalidate };
}

describe("useDecide", () => {
  it("sends the analysis id with the request and saves the answer on the cached analysis", async () => {
    const decision = decide("neutral");
    const { api, hook, cached, invalidate } = await setup({ "POST /api/decide": decision });
    await act(async () => hook.result.current.mutate({ view: "neutral", maxLoss: 20000 }));
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));

    expect(JSON.parse(String(api.calls[0].init?.body))).toEqual({ view: "neutral", maxLoss: 20000, analysisId: "an-1" });
    expect(cached().decision).toEqual(decision);
    expect(initialCompareState(cached().decision).single).toEqual(decision);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ANALYSES_KEY });
  });

  it("joins each pane's answer into one compare pair, as the server stores it", async () => {
    const left = decide("bullish");
    const right = decide("bearish");
    const { hook, cached } = await setup({ "POST /api/decide": left });
    await act(async () => hook.result.current.mutate({ view: "bullish", maxLoss: 20000, pane: "left" }));
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    expect(initialCompareState(cached().decision).left).toEqual(left);
    expect(initialCompareState(cached().decision).right).toBeNull();

    mockApiFetch = fakeApi({ "POST /api/decide": right }).apiFetch;
    await act(async () => hook.result.current.mutate({ view: "bearish", maxLoss: 20000, pane: "right" }));
    await waitFor(() => expect(initialCompareState(cached().decision).right).toEqual(right));
    const state = initialCompareState(cached().decision);
    expect(state.left).toEqual(left);
    expect(state.compareMode).toBe(true);
  });

  it("replaces a pair with a single answer", async () => {
    const { hook, cached } = await setup({ "POST /api/decide": decide("volatile") });
    await act(async () => hook.result.current.mutate({ view: "bullish", maxLoss: 20000, pane: "left" }));
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    hook.result.current.reset();
    await act(async () => hook.result.current.mutate({ view: "volatile", maxLoss: 20000 }));
    await waitFor(() => expect(initialCompareState(cached().decision).single).not.toBeNull());
    expect(initialCompareState(cached().decision).compareMode).toBe(false);
  });

  it("leaves the cached analysis alone when scoring fails", async () => {
    const { hook, cached } = await setup({ "POST /api/decide": failure(500, "Model is down") });
    await act(async () => hook.result.current.mutate({ view: "neutral", maxLoss: 20000 }));
    await waitFor(() => expect(hook.result.current.isError).toBe(true));
    expect(cached().decision).toBeNull();
  });
});
