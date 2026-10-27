import { createApiFetch } from "@/lib/auth/apiFetch";
import { SignedOutError } from "@/lib/auth/errors";
import { createBearerStrategy, createCookieStrategy, type SessionStrategy } from "@/lib/auth/strategy";
import { createTokenRefresher } from "@/lib/auth/tokenRefresher";
import { jsonResponse, makeJwt } from "./helpers";

const BASE = "https://www.optionpilot.tech";
const NOW_S = 1_800_000_000;

function setup(strategyFactory?: (fetchJwt: () => Promise<string>) => SessionStrategy) {
  let issued = 0;
  const fetchJwt = jest.fn(async () => makeJwt(NOW_S + 900, { n: ++issued }));
  const refresher = createTokenRefresher({ fetchJwt, now: () => NOW_S * 1000 });
  const strategy = strategyFactory?.(fetchJwt) ?? createBearerStrategy("session-token", refresher);
  const fetchImpl = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
  const onSignedOut = jest.fn();
  const apiFetch = createApiFetch({ baseUrl: BASE, getStrategy: () => strategy, onSignedOut, fetchImpl });
  return { apiFetch, fetchImpl, fetchJwt, onSignedOut };
}

function lastCall(fetchImpl: jest.Mock, index = -1) {
  const calls = fetchImpl.mock.calls;
  const [url, init] = calls.at(index) as [string, RequestInit];
  return { url, init, headers: init.headers as Record<string, string> };
}

describe("apiFetch with a bearer session", () => {
  it("sends the JWT as a Bearer header, to the base URL, without following redirects", async () => {
    const { apiFetch, fetchImpl, fetchJwt } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ ok: true }));

    const response = await apiFetch("/api/history", { method: "GET", headers: { accept: "application/json" } });

    expect(response.status).toBe(200);
    const { url, init, headers } = lastCall(fetchImpl);
    expect(url).toBe(`${BASE}/api/history`);
    expect(init.redirect).toBe("manual");
    expect(init.credentials).toBe("omit");
    expect(headers.accept).toBe("application/json");
    expect(headers.authorization).toBe(`Bearer ${await fetchJwt.mock.results[0]!.value}`);
  });

  it("reuses the cached JWT across requests", async () => {
    const { apiFetch, fetchImpl, fetchJwt } = setup();
    fetchImpl.mockImplementation(async () => jsonResponse({}));
    await apiFetch("/api/a");
    await apiFetch("api/b");
    expect(fetchJwt).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[1]![0]).toBe(`${BASE}/api/b`);
  });

  it("retries once with a fresh JWT after a 401 and returns that answer", async () => {
    const { apiFetch, fetchImpl, fetchJwt, onSignedOut } = setup();
    fetchImpl.mockResolvedValueOnce(new Response(null, { status: 401 })).mockResolvedValueOnce(jsonResponse({ ok: 1 }));

    const response = await apiFetch("/api/analyze", { method: "POST", body: "{}" });

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchJwt).toHaveBeenCalledTimes(2);
    expect(lastCall(fetchImpl, 0).headers.authorization).not.toBe(lastCall(fetchImpl, 1).headers.authorization);
    expect(onSignedOut).not.toHaveBeenCalled();
  });

  it("counts a second 401 as signed out", async () => {
    const { apiFetch, fetchImpl, onSignedOut } = setup();
    fetchImpl.mockResolvedValue(new Response(null, { status: 401 }));
    await expect(apiFetch("/api/history")).rejects.toBeInstanceOf(SignedOutError);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(onSignedOut).toHaveBeenCalledTimes(1);
  });

  it("counts a redirect as signed out", async () => {
    const { apiFetch, fetchImpl, onSignedOut } = setup();
    fetchImpl.mockImplementation(async () => new Response(null, { status: 307, headers: { location: "/auth/sign-in" } }));
    await expect(apiFetch("/api/history")).rejects.toBeInstanceOf(SignedOutError);
    expect(onSignedOut).toHaveBeenCalledTimes(1);
  });

  it("counts an opaque redirect and a followed redirect as signed out", async () => {
    const { apiFetch, fetchImpl } = setup();
    const opaque = Object.defineProperty(new Response(null), "type", { value: "opaqueredirect" });
    const followed = Object.defineProperty(new Response(null), "redirected", { value: true });
    fetchImpl.mockResolvedValue(opaque);
    await expect(apiFetch("/api/a")).rejects.toBeInstanceOf(SignedOutError);
    fetchImpl.mockResolvedValue(followed);
    await expect(apiFetch("/api/a")).rejects.toBeInstanceOf(SignedOutError);
  });

  it("signs out when the token exchange itself is refused", async () => {
    const { apiFetch, fetchImpl, onSignedOut } = setup(() =>
      createBearerStrategy(
        "session-token",
        createTokenRefresher({ fetchJwt: () => Promise.reject(new SignedOutError()) }),
      ),
    );
    await expect(apiFetch("/api/history")).rejects.toBeInstanceOf(SignedOutError);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(onSignedOut).toHaveBeenCalledTimes(1);
  });

  it("lets other errors through without signing out", async () => {
    const { apiFetch, fetchImpl, onSignedOut } = setup();
    fetchImpl.mockRejectedValue(new TypeError("Network request failed"));
    await expect(apiFetch("/api/history")).rejects.toThrow("Network request failed");
    expect(onSignedOut).not.toHaveBeenCalled();
  });

  it("passes server errors back to the caller", async () => {
    const { apiFetch, fetchImpl, onSignedOut } = setup();
    fetchImpl.mockResolvedValue(new Response(null, { status: 500 }));
    expect((await apiFetch("/api/history")).status).toBe(500);
    expect(onSignedOut).not.toHaveBeenCalled();
  });
});

describe("apiFetch with no session or a cookie session", () => {
  it("throws signed out when nobody is signed in", async () => {
    const fetchImpl = jest.fn();
    const apiFetch = createApiFetch({ baseUrl: BASE, getStrategy: () => null, onSignedOut: jest.fn(), fetchImpl });
    await expect(apiFetch("/api/history")).rejects.toBeInstanceOf(SignedOutError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sends cookies, adds no Authorization header and does not retry a 401", async () => {
    const { apiFetch, fetchImpl, onSignedOut } = setup(() => createCookieStrategy());
    fetchImpl.mockResolvedValue(new Response(null, { status: 401 }));
    await expect(apiFetch("/api/history")).rejects.toBeInstanceOf(SignedOutError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const { init, headers } = lastCall(fetchImpl);
    expect(init.credentials).toBe("include");
    expect(init.redirect).toBe("manual");
    expect(headers?.authorization).toBeUndefined();
    expect(onSignedOut).toHaveBeenCalledTimes(1);
  });
});
