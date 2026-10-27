import { createApiFetch, type ApiFetch } from "./apiFetch";
import type { AuthApi } from "./authApi";
import { AuthError, SignedOutError } from "./errors";
import type { SessionStore } from "./sessionStore";
import { createBearerStrategy, createCookieStrategy, type SessionStrategy } from "./strategy";
import { createTokenRefresher } from "./tokenRefresher";
import type { AuthUser, StoredSession } from "./types";

export type SessionManagerOptions = {
  api: AuthApi;
  store: SessionStore;
  baseUrl: string;
  /** Tells the UI the session ended without the person asking, e.g. after a 401. */
  onSignedOut?: () => void;
  fetchImpl?: typeof fetch;
};

function strategyFor(api: AuthApi, session: StoredSession): SessionStrategy {
  if (session.mode === "cookie" || !session.sessionToken) return createCookieStrategy();
  const { sessionToken } = session;
  const refresher = createTokenRefresher({ fetchJwt: () => api.fetchJwt(sessionToken) });
  return createBearerStrategy(sessionToken, refresher);
}

/**
 * Owns the signed-in session: restores it from secure storage, signs in and out, and builds the
 * `apiFetch` that authenticates requests. It holds no React state, so it can be tested on its own.
 */
export function createSessionManager({ api, store, baseUrl, onSignedOut, fetchImpl }: SessionManagerOptions) {
  let strategy: SessionStrategy | null = null;
  let user: AuthUser | null = null;

  async function end(): Promise<void> {
    strategy?.dispose();
    strategy = null;
    user = null;
    await store.clear();
  }

  const apiFetch: ApiFetch = createApiFetch({
    baseUrl,
    getStrategy: () => strategy,
    onSignedOut: () => {
      void end().then(() => onSignedOut?.());
    },
    fetchImpl,
  });

  /** Starts a session from what sign-in returned. Prefers bearer and falls back to cookies. */
  async function begin(result: { user: AuthUser; sessionToken: string | null }): Promise<AuthUser> {
    let next: StoredSession | null = null;

    if (result.sessionToken) {
      const candidate: StoredSession = { mode: "bearer", sessionToken: result.sessionToken, user: result.user };
      try {
        // Proves the token before it is stored: the exchange is the call every request depends on.
        await strategyFor(api, candidate).authorize({}, { force: true });
        next = candidate;
      } catch (error) {
        if (!(error instanceof SignedOutError)) throw error;
      }
    }

    if (!next) {
      const cookieUser = await api.getSession({ cookies: true });
      if (!cookieUser) {
        throw new AuthError("unknown", "Signed in, but this app could not start a session. Try again.");
      }
      next = { mode: "cookie", sessionToken: null, user: cookieUser };
    }

    await store.save(next);
    strategy = strategyFor(api, next);
    user = next.user;
    return next.user;
  }

  return {
    apiFetch,

    get user(): AuthUser | null {
      return user;
    },

    get mode() {
      return strategy?.mode ?? null;
    },

    /** Loads the stored session. It does not call the network, so an offline launch stays signed in. */
    async restore(): Promise<AuthUser | null> {
      const stored = await store.load();
      if (!stored) return null;
      strategy = strategyFor(api, stored);
      user = stored.user;
      return user;
    },

    async signIn(email: string, password: string): Promise<AuthUser> {
      return begin(await api.signIn(email, password));
    },

    /** Always clears local state, even when the server cannot be reached. */
    async signOut(): Promise<void> {
      const call = strategy?.sessionCall();
      try {
        if (call) await api.signOut(call);
      } catch {
        // The device is signed out either way. A server-side session left behind expires on its own.
      }
      await end();
    },
  };
}

export type SessionManager = ReturnType<typeof createSessionManager>;
