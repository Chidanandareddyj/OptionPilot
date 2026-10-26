import { ApiError, createApi } from "@/lib/api/client";
import { isOnline } from "@/lib/api/online";
import { shouldRetry } from "@/lib/api/QueryProvider";
import { analysisErrorMessage } from "@/lib/analysis/errors";
import { SignedOutError } from "@/lib/auth/errors";
import { failure, fakeApi, QUOTES } from "./app-harness";

describe("createApi", () => {
  it("fetches the relay's address and a 60-second token", async () => {
    const answer = { url: "https://relay.test", token: "1790000000000.ab" };
    const { apiFetch, calls } = fakeApi({ "GET /api/derivatives/token": answer });
    expect(await createApi(apiFetch).derivativesToken()).toEqual(answer);
    expect(calls[0]!.path).toBe("/api/derivatives/token");
  });

  it("reads a missing relay as an error the board can show", async () => {
    const { apiFetch } = fakeApi({ "GET /api/derivatives/token": failure(503, "Live feed is not configured.") });
    await expect(createApi(apiFetch).derivativesToken()).rejects.toMatchObject({ status: 503, message: "Live feed is not configured." });
  });

  it("asks for stock quotes with the symbols in the query", async () => {
    const { apiFetch, calls } = fakeApi({ "GET /api/market/quotes": { quotes: QUOTES } });
    const quotes = await createApi(apiFetch).quotes(["RELIANCE", "TCS"]);
    expect(quotes).toEqual(QUOTES);
    expect(decodeURIComponent(calls[0]!.path)).toBe("/api/market/quotes?symbols=RELIANCE,TCS");
  });

  it("skips the request when there are no symbols", async () => {
    const { apiFetch, calls } = fakeApi({});
    expect(await createApi(apiFetch).quotes([])).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("unwraps the newest page of saved analyses", async () => {
    const { apiFetch } = fakeApi({ "GET /api/analyses": { analyses: [{ id: "a" }], nextCursor: null } });
    expect(await createApi(apiFetch).recentAnalyses()).toEqual([{ id: "a" }]);
  });

  it("escapes the id in the analysis path", async () => {
    const { apiFetch, calls } = fakeApi({});
    await createApi(apiFetch)
      .analysis("a/b")
      .catch(() => {});
    expect(calls[0]!.path).toBe("/api/analyses/a%2Fb");
  });

  it("posts the symbol as JSON, passing the abort signal on", async () => {
    const { apiFetch, calls } = fakeApi({ "POST /api/analyze": { id: "x" } });
    const controller = new AbortController();
    await createApi(apiFetch).analyze("SBIN", controller.signal);
    const init = calls[0]!.init!;
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "content-type": "application/json" });
    expect(JSON.parse(String(init.body))).toEqual({ company: "SBIN" });
    expect(init.signal).toBe(controller.signal);
  });

  it("turns an error status into an ApiError carrying the server's message", async () => {
    const { apiFetch } = fakeApi({ "GET /api/analyses": failure(502, "Upstream down") });
    const error = await createApi(apiFetch)
      .recentAnalyses()
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 502, message: "Upstream down" });
  });

  it("falls back to a plain message when the error body is not JSON", async () => {
    const apiFetch = jest.fn(async () => new Response("<html>", { status: 500 }));
    await expect(createApi(apiFetch).indices()).rejects.toMatchObject({ status: 500, message: "The request failed (500)." });
  });
});

describe("shouldRetry", () => {
  it("retries a dropped connection twice", () => {
    const error = new TypeError("Network request failed");
    expect([0, 1, 2].map((count) => shouldRetry(count, error))).toEqual([true, true, false]);
  });

  it("retries a server fault but not a rejected request", () => {
    expect(shouldRetry(0, new ApiError("boom", 503))).toBe(true);
    expect(shouldRetry(0, new ApiError("nope", 404))).toBe(false);
    expect(shouldRetry(0, new ApiError("slow down", 429))).toBe(false);
  });

  it("never retries once the session is over", () => {
    expect(shouldRetry(0, new SignedOutError())).toBe(false);
  });
});

describe("isOnline", () => {
  it("is offline only when the device says so", () => {
    expect(isOnline({ isConnected: true, isInternetReachable: true })).toBe(true);
    expect(isOnline({ isConnected: null, isInternetReachable: null })).toBe(true);
    expect(isOnline({ isConnected: true, isInternetReachable: null })).toBe(true);
    expect(isOnline({ isConnected: false, isInternetReachable: false })).toBe(false);
    expect(isOnline({ isConnected: true, isInternetReachable: false })).toBe(false);
  });
});

describe("analysisErrorMessage", () => {
  it("names the symbol when the server found no option chain for it", () => {
    expect(analysisErrorMessage(new ApiError("No option instruments found", 404), "ZZZ")).toBe(
      "No option chain found for ZZZ. Check the symbol and try again.",
    );
  });

  it("asks to try again for any other server answer", () => {
    expect(analysisErrorMessage(new ApiError("boom", 500), "TCS")).toBe("Could not analyse TCS right now. Try again in a moment.");
    expect(analysisErrorMessage(new SignedOutError(), "TCS")).toMatch(/^Could not analyse TCS/);
  });

  it("blames the connection when no answer came at all", () => {
    expect(analysisErrorMessage(new TypeError("Network request failed"), "TCS")).toMatch(/Check your connection/);
  });
});
