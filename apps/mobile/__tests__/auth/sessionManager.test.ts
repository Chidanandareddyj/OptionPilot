import { createAuthApi } from "@/lib/auth/authApi";
import { SignedOutError } from "@/lib/auth/errors";
import { createSessionManager } from "@/lib/auth/sessionManager";
import { createSessionStore } from "@/lib/auth/sessionStore";
import { jsonResponse, makeJwt, memoryBackend, USER } from "./helpers";

const BASE = "https://www.optionpilot.tech";
const SESSION_KEY = "optionpilot.session";

function setup(initial: Record<string, string> = {}) {
  const backend = memoryBackend(initial);
  const fetchImpl = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
  const onSignedOut = jest.fn();
  const api = createAuthApi({ baseUrl: BASE, fetchImpl });
  const manager = createSessionManager({ api, store: createSessionStore(backend), baseUrl: BASE, onSignedOut, fetchImpl });
  const urls = () => fetchImpl.mock.calls.map(([url]) => String(url).replace(BASE, ""));
  return { manager, backend, fetchImpl, onSignedOut, urls };
}

const jwt = () => makeJwt(Math.floor(Date.now() / 1000) + 900, { sub: USER.id });
const signInResponse = (token?: string) =>
  jsonResponse({ user: USER }, token ? { headers: { "set-auth-token": token } } : {});

describe("signing in", () => {
  it("proves the session token with the JWT exchange, then stores it", async () => {
    const { manager, backend, fetchImpl, urls } = setup();
    fetchImpl.mockResolvedValueOnce(signInResponse("signed.token")).mockResolvedValueOnce(jsonResponse({ token: jwt() }));

    await expect(manager.signIn("asha@example.com", "pw")).resolves.toEqual(USER);

    expect(urls()).toEqual(["/api/auth/sign-in/email", "/api/auth/token"]);
    expect(manager.mode).toBe("bearer");
    expect(JSON.parse(backend.data.get(SESSION_KEY)!)).toEqual({ mode: "bearer", sessionToken: "signed.token", user: USER });
  });

  it("never writes the JWT to storage", async () => {
    const { manager, backend, fetchImpl } = setup();
    const token = jwt();
    fetchImpl.mockResolvedValueOnce(signInResponse("signed.token")).mockResolvedValueOnce(jsonResponse({ token }));
    await manager.signIn("asha@example.com", "pw");
    expect([...backend.data.values()].join()).not.toContain(token);
  });

  it("falls back to the cookie session when no token header is sent", async () => {
    const { manager, backend, fetchImpl, urls } = setup();
    fetchImpl.mockResolvedValueOnce(signInResponse()).mockResolvedValueOnce(jsonResponse({ user: USER }));

    await manager.signIn("asha@example.com", "pw");

    expect(urls()).toEqual(["/api/auth/sign-in/email", "/api/auth/get-session"]);
    expect(manager.mode).toBe("cookie");
    expect(JSON.parse(backend.data.get(SESSION_KEY)!)).toEqual({ mode: "cookie", sessionToken: null, user: USER });
  });

  it("falls back to cookies when the header token is refused", async () => {
    const { manager, fetchImpl } = setup();
    fetchImpl
      .mockResolvedValueOnce(signInResponse("bad"))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ user: USER }));
    await manager.signIn("asha@example.com", "pw");
    expect(manager.mode).toBe("cookie");
  });

  it("fails and stores nothing when neither path gives a session", async () => {
    const { manager, backend, fetchImpl } = setup();
    fetchImpl.mockResolvedValueOnce(signInResponse()).mockResolvedValueOnce(jsonResponse(null));
    await expect(manager.signIn("asha@example.com", "pw")).rejects.toMatchObject({ name: "AuthError" });
    expect(backend.data.size).toBe(0);
    expect(manager.user).toBeNull();
  });

  it("passes wrong credentials through", async () => {
    const { manager, backend, fetchImpl } = setup();
    fetchImpl.mockResolvedValueOnce(jsonResponse({ code: "INVALID_EMAIL_OR_PASSWORD" }, { status: 401 }));
    await expect(manager.signIn("asha@example.com", "nope")).rejects.toMatchObject({ code: "invalid-credentials" });
    expect(backend.data.size).toBe(0);
  });
});

describe("restoring", () => {
  const stored = JSON.stringify({ mode: "bearer", sessionToken: "signed.token", user: USER });

  it("signs back in from secure storage without calling the network", async () => {
    const { manager, fetchImpl } = setup({ [SESSION_KEY]: stored });
    await expect(manager.restore()).resolves.toEqual(USER);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fetches the JWT on the first API call and sends it", async () => {
    const { manager, fetchImpl, urls } = setup({ [SESSION_KEY]: stored });
    const token = jwt();
    fetchImpl.mockResolvedValueOnce(jsonResponse({ token })).mockResolvedValueOnce(jsonResponse({ rows: [] }));
    await manager.restore();

    await manager.apiFetch("/api/history");

    expect(urls()).toEqual(["/api/auth/token", "/api/history"]);
    expect((fetchImpl.mock.calls[1]![1]!.headers as Record<string, string>).authorization).toBe(`Bearer ${token}`);
  });

  it.each([[""], ["{not json"], [JSON.stringify({ mode: "bearer", user: USER })], [JSON.stringify({ mode: "other" })]])(
    "treats %j as no session",
    async (raw) => {
      const { manager } = setup(raw ? { [SESSION_KEY]: raw } : {});
      await expect(manager.restore()).resolves.toBeNull();
    },
  );

  it("clears storage and tells the UI when the server later rejects the session", async () => {
    const { manager, backend, fetchImpl, onSignedOut } = setup({ [SESSION_KEY]: stored });
    fetchImpl.mockResolvedValue(new Response(null, { status: 401 }));
    await manager.restore();

    await expect(manager.apiFetch("/api/history")).rejects.toBeInstanceOf(SignedOutError);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(backend.data.size).toBe(0);
    expect(onSignedOut).toHaveBeenCalledTimes(1);
    expect(manager.user).toBeNull();
  });
});

describe("signing out", () => {
  it("tells the server with the session token, then clears storage", async () => {
    const { manager, backend, fetchImpl, urls } = setup({
      [SESSION_KEY]: JSON.stringify({ mode: "bearer", sessionToken: "signed.token", user: USER }),
    });
    fetchImpl.mockResolvedValue(jsonResponse({ success: true }));
    await manager.restore();

    await manager.signOut();

    expect(urls()).toEqual(["/api/auth/sign-out"]);
    expect((fetchImpl.mock.calls[0]![1]!.headers as Record<string, string>).authorization).toBe("Bearer signed.token");
    expect(backend.data.size).toBe(0);
    expect(manager.user).toBeNull();
    await expect(manager.apiFetch("/api/history")).rejects.toBeInstanceOf(SignedOutError);
  });

  it("clears storage even when the server cannot be reached", async () => {
    const { manager, backend, fetchImpl } = setup({
      [SESSION_KEY]: JSON.stringify({ mode: "bearer", sessionToken: "signed.token", user: USER }),
    });
    fetchImpl.mockRejectedValue(new TypeError("offline"));
    await manager.restore();
    await manager.signOut();
    expect(backend.data.size).toBe(0);
  });
});
