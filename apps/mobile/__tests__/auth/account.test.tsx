import { act, render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { AuthProvider, useAuth, type AuthState } from "@/lib/auth";
import { createAuthApi } from "@/lib/auth/authApi";
import { AuthError, SignedOutError } from "@/lib/auth/errors";
import { createSessionManager } from "@/lib/auth/sessionManager";
import { createSessionStore } from "@/lib/auth/sessionStore";
import { jsonResponse, makeJwt, memoryBackend, USER } from "./helpers";

const BASE = "https://www.optionpilot.tech";
const SESSION_KEY = "optionpilot.session";
const BEARER = { sessionToken: "signed.token" };
const jwt = () => makeJwt(Math.floor(Date.now() / 1000) + 900, { sub: USER.id });
const stored = (user: object = USER) => ({ [SESSION_KEY]: JSON.stringify({ mode: "bearer", sessionToken: "signed.token", user }) });

function apiSetup() {
  const fetchImpl = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
  const api = createAuthApi({ baseUrl: BASE, fetchImpl });
  const call = (index = 0) => {
    const [url, init] = fetchImpl.mock.calls[index] as [string, RequestInit];
    return {
      path: url.replace(BASE, ""),
      method: init.method,
      credentials: init.credentials,
      auth: (init.headers as Record<string, string>).authorization,
      body: init.body ? JSON.parse(init.body as string) : undefined,
    };
  };
  return { api, fetchImpl, call };
}

describe("account calls on the auth API", () => {
  it("reads the session with the avatar and the session id, over the bearer token", async () => {
    const { api, fetchImpl, call } = apiSetup();
    fetchImpl.mockResolvedValue(jsonResponse({ user: { ...USER, image: "data:image/jpeg;base64,AAAA" }, session: { id: "s-1" } }));

    await expect(api.getAccountSession(BEARER)).resolves.toEqual({
      user: { ...USER, image: "data:image/jpeg;base64,AAAA" },
      sessionId: "s-1",
    });
    expect(call()).toMatchObject({ path: "/api/auth/get-session", method: "GET", credentials: "omit", auth: "Bearer signed.token" });
  });

  it("uses the cookie session when there is no bearer token", async () => {
    const { api, fetchImpl, call } = apiSetup();
    fetchImpl.mockResolvedValue(jsonResponse([]));
    await api.listSessions({ cookies: true });
    expect(call()).toMatchObject({ path: "/api/auth/list-sessions", credentials: "include", auth: undefined });
  });

  it("answers a 401 on get-session as a signed-out error", async () => {
    const { api, fetchImpl } = apiSetup();
    fetchImpl.mockResolvedValue(jsonResponse({ message: "Unauthorized" }, { status: 401 }));
    await expect(api.getAccountSession(BEARER)).rejects.toMatchObject({ name: "AuthError", status: 401 });
  });

  it("sends the update, change and revoke bodies, trimmed, with the bearer header", async () => {
    const { api, fetchImpl, call } = apiSetup();
    fetchImpl.mockImplementation(async () => jsonResponse({ status: true }));

    await api.updateUser(BEARER, { name: "  Asha R  " });
    await api.updateUser(BEARER, { image: null });
    await api.changeEmail(BEARER, " new@example.com ");
    await api.changePassword(BEARER, { currentPassword: "old-pass", newPassword: "new-pass-1" });
    await api.revokeSession(BEARER, "tok-2");
    await api.createOrganization(BEARER, { name: " Acme ", slug: "acme" });
    await api.deleteUser(BEARER);

    expect(call(0)).toMatchObject({ path: "/api/auth/update-user", method: "POST", auth: "Bearer signed.token", body: { name: "Asha R" } });
    expect(call(1).body).toEqual({ image: null });
    expect(call(2)).toMatchObject({ path: "/api/auth/change-email", body: { newEmail: "new@example.com" } });
    expect(call(3)).toMatchObject({
      path: "/api/auth/change-password",
      body: { currentPassword: "old-pass", newPassword: "new-pass-1", revokeOtherSessions: false },
    });
    expect(call(4)).toMatchObject({ path: "/api/auth/revoke-session", body: { token: "tok-2" } });
    expect(call(5)).toMatchObject({ path: "/api/auth/organization/create", body: { name: "Acme", slug: "acme" } });
    expect(call(6)).toMatchObject({ path: "/api/auth/delete-user", method: "POST" });
  });

  it("maps a wrong current password to invalid-credentials", async () => {
    const { api, fetchImpl } = apiSetup();
    fetchImpl.mockResolvedValue(jsonResponse({ code: "INVALID_PASSWORD", message: "Invalid password" }, { status: 400 }));
    const error = await api.changePassword(BEARER, { currentPassword: "x", newPassword: "yyyyyyyy" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AuthError);
  });

  it("keeps only well-formed rows when listing accounts, sessions and organizations", async () => {
    const { api, fetchImpl } = apiSetup();
    fetchImpl
      .mockResolvedValueOnce(jsonResponse([{ id: "a1", providerId: "google" }, { id: "a2" }, "junk"]))
      .mockResolvedValueOnce(jsonResponse([{ id: "s1", token: "t1", userAgent: "ua", ipAddress: "1.2.3.4", createdAt: "2026-10-26T00:00:00Z" }, { id: "s2" }]))
      .mockResolvedValueOnce(jsonResponse([{ id: "o1", name: "Acme", slug: "acme", logo: null }, { id: "o2", name: "NoSlug" }]));

    await expect(api.listAccounts(BEARER)).resolves.toEqual([{ id: "a1", providerId: "google" }]);
    await expect(api.listSessions(BEARER)).resolves.toEqual([
      { id: "s1", token: "t1", userAgent: "ua", ipAddress: "1.2.3.4", createdAt: "2026-10-26T00:00:00Z" },
    ]);
    await expect(api.listOrganizations(BEARER)).resolves.toEqual([{ id: "o1", name: "Acme", slug: "acme", logo: null }]);
  });
});

describe("account on the session manager", () => {
  function managerSetup() {
    const backend = memoryBackend(stored());
    const fetchImpl = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
    const onSignedOut = jest.fn();
    const api = createAuthApi({ baseUrl: BASE, fetchImpl });
    const manager = createSessionManager({ api, store: createSessionStore(backend), baseUrl: BASE, onSignedOut, fetchImpl });
    return { manager, backend, fetchImpl, onSignedOut };
  }

  it("saves a new name to the device without ever storing the avatar", async () => {
    const { manager, backend, fetchImpl } = managerSetup();
    await manager.restore();
    fetchImpl.mockResolvedValue(jsonResponse({ status: true }));

    const user = await manager.account.updateName(" Asha Rao ");

    expect(user).toEqual({ ...USER, name: "Asha Rao" });
    expect(JSON.parse(backend.data.get(SESSION_KEY)!).user).toEqual({ ...USER, name: "Asha Rao" });
  });

  it("does not persist an image that arrives with the stored user", async () => {
    const backend = memoryBackend();
    await createSessionStore(backend).save({ mode: "bearer", sessionToken: "t", user: { ...USER, image: "data:image/jpeg;base64,AAAA" } });
    expect(JSON.parse(backend.data.get(SESSION_KEY)!).user).toEqual(USER);
  });

  it("ends the session and throws SignedOutError when an account call is rejected with 401", async () => {
    const { manager, backend, fetchImpl, onSignedOut } = managerSetup();
    await manager.restore();
    fetchImpl.mockResolvedValue(jsonResponse({ message: "Unauthorized" }, { status: 401 }));

    await expect(manager.account.listSessions()).rejects.toBeInstanceOf(SignedOutError);

    expect(onSignedOut).toHaveBeenCalled();
    expect(backend.data.size).toBe(0);
  });

  it("passes other failures through and stays signed in", async () => {
    const { manager, backend, fetchImpl, onSignedOut } = managerSetup();
    await manager.restore();
    fetchImpl.mockResolvedValue(jsonResponse({ message: "boom" }, { status: 500 }));

    await expect(manager.account.listOrganizations()).rejects.toBeInstanceOf(AuthError);

    expect(onSignedOut).not.toHaveBeenCalled();
    expect(backend.data.size).toBe(1);
  });
});

describe("deleteAccount on the provider", () => {
  type Route = (url: string, init: RequestInit) => Response | Promise<Response>;

  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  async function setup(accountRoute: Route, authRoutes: Record<string, Route> = {}) {
    const backend = memoryBackend(stored());
    const seen: { url: string; method: string }[] = [];
    const fetchImpl = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const path = new URL(url).pathname;
      seen.push({ url: path, method: init?.method ?? "GET" });
      if (path === "/api/auth/token") return jsonResponse({ token: jwt() });
      if (path === "/api/auth/sign-out") return jsonResponse({ success: true });
      if (path === "/api/account") return accountRoute(url, init ?? {});
      const route = authRoutes[path];
      return route ? route(url, init ?? {}) : jsonResponse({ message: "Not found" }, { status: 404 });
    });
    // The provider's own API client uses fetchImpl; its apiFetch for /api/account uses the global one.
    global.fetch = fetchImpl as typeof fetch;
    let auth: AuthState | undefined;
    function Probe() {
      auth = useAuth();
      return <Text>{auth.isReady ? (auth.user ? "in" : "out") : "loading"}</Text>;
    }
    await render(
      <AuthProvider api={createAuthApi({ baseUrl: BASE, fetchImpl: fetchImpl as typeof fetch })} store={createSessionStore(backend)} baseUrl={BASE}>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText("in");
    return {
      backend,
      seen,
      run: async () => {
        let result: Awaited<ReturnType<AuthState["deleteAccount"]>> | undefined;
        let failure: unknown;
        await act(async () => {
          await auth!.deleteAccount().then(
            (value) => void (result = value),
            (error: unknown) => void (failure = error),
          );
        });
        if (failure) throw failure;
        return result;
      },
    };
  }

  it("deletes the data, then signs out when the server removed the login too", async () => {
    const { backend, seen, run } = await setup(() => jsonResponse({ analysesDeleted: 3, authUserDeleted: true }));

    await expect(run()).resolves.toEqual({ loginDeleted: true });

    expect(seen.find((c) => c.url === "/api/account")?.method).toBe("DELETE");
    expect(seen.some((c) => c.url === "/api/auth/delete-user")).toBe(false);
    expect(backend.data.size).toBe(0);
    await screen.findByText("out");
  });

  it("asks Neon Auth to delete the login itself when the server could not", async () => {
    const { backend, seen, run } = await setup(() => jsonResponse({ analysesDeleted: 2, authUserDeleted: false }), {
      "/api/auth/delete-user": () => jsonResponse({ success: true }),
    });

    await expect(run()).resolves.toEqual({ loginDeleted: true });

    expect(seen.map((c) => c.url)).toContain("/api/auth/delete-user");
    expect(backend.data.size).toBe(0);
  });

  it("stays signed in and reports loginDeleted: false when nobody could remove the login", async () => {
    const { backend, run } = await setup(() => jsonResponse({ analysesDeleted: 2, authUserDeleted: false }), {
      "/api/auth/delete-user": () => jsonResponse({ message: "disabled" }, { status: 403 }),
    });

    await expect(run()).resolves.toEqual({ loginDeleted: false });

    expect(backend.data.size).toBe(1);
    expect(screen.getByText("in")).toBeOnTheScreen();
  });

  it("throws and signs nobody out when the server fails, so nothing was deleted", async () => {
    const { backend, seen, run } = await setup(() => jsonResponse({ error: "Could not delete the account." }, { status: 500 }));

    await expect(run()).rejects.toMatchObject({ status: 500 });

    expect(seen.some((c) => c.url === "/api/auth/delete-user")).toBe(false);
    expect(backend.data.size).toBe(1);
    await waitFor(() => expect(screen.getByText("in")).toBeOnTheScreen());
  });
});
