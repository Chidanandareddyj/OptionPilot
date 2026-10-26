import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AnalyzeFlowProvider, useAnalyzeFlow } from "@/lib/analysis/AnalyzeFlow";
import { analysisKey } from "@/lib/api/keys";
import { analysisResult } from "./fixtures/analysis";
import { failure, fakeApi } from "./app-harness";

let mockApiFetch: ReturnType<typeof fakeApi>["apiFetch"];
jest.mock("@/lib/auth", () => ({ useAuth: () => ({ apiFetch: (path: string, init?: RequestInit) => mockApiFetch(path, init) }) }));

const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>
    <AnalyzeFlowProvider>{children}</AnalyzeFlowProvider>
  </QueryClientProvider>
);

async function flow(routes: Parameters<typeof fakeApi>[0]) {
  const api = fakeApi(routes);
  mockApiFetch = api.apiFetch;
  return { api, ...(await renderHook(() => useAnalyzeFlow(), { wrapper })) };
}

describe("AnalyzeFlow", () => {
  beforeEach(() => client.clear());

  it("refuses an empty symbol", async () => {
    const { result, api } = await flow({});
    expect(result.current.start("   ")).toBe(false);
    expect(result.current.state).toEqual({ status: "idle" });
    expect(api.calls).toHaveLength(0);
  });

  it("runs, then holds the new analysis id and caches the detail for the next screen", async () => {
    const { result } = await flow({ "POST /api/analyze": { id: "n1", ...analysisResult(), options: [] } });
    await act(async () => void result.current.start(" sbin "));
    await waitFor(() => expect(result.current.state).toEqual({ status: "done", symbol: "SBIN", id: "n1" }));
    const cached = client.getQueryData<{ company: string; spot: number }>(analysisKey("n1"));
    expect(cached).toMatchObject({ company: "SBIN", spot: 1190 });
  });

  it("holds a message for the Terminal when the run fails", async () => {
    const { result } = await flow({ "POST /api/analyze": failure(500, "boom") });
    await act(async () => void result.current.start("TCS"));
    await waitFor(() => expect(result.current.state.status).toBe("failed"));
    expect(result.current.state).toMatchObject({ symbol: "TCS", message: expect.stringMatching(/Could not analyse TCS/) });
  });

  it("drops a run on reset: its signal aborts and a late answer is ignored", async () => {
    let answer: (value: unknown) => void = () => {};
    const { result, api } = await flow({ "POST /api/analyze": () => new Promise((resolve) => (answer = resolve)) });
    await act(async () => void result.current.start("TCS"));
    const signal = api.calls[0]!.init!.signal as AbortSignal;

    await act(async () => result.current.reset());
    expect(signal.aborted).toBe(true);
    expect(result.current.state).toEqual({ status: "idle" });

    await act(async () => answer({ id: "late", ...analysisResult(), options: [] }));
    expect(result.current.state).toEqual({ status: "idle" });
    expect(client.getQueryData(analysisKey("late"))).toBeUndefined();
  });

  it("lets a newer run replace an older one", async () => {
    const { result, api } = await flow({ "POST /api/analyze": () => new Promise(() => {}) });
    await act(async () => void result.current.start("TCS"));
    await act(async () => void result.current.start("INFY"));
    expect((api.calls[0]!.init!.signal as AbortSignal).aborted).toBe(true);
    expect(result.current.state).toEqual({ status: "running", symbol: "INFY" });
  });

  it("keeps the typed symbol for the search sheet and the Terminal to share", async () => {
    const { result } = await flow({});
    await act(async () => result.current.setQuery("REL"));
    expect(result.current.query).toBe("REL");
  });
});
