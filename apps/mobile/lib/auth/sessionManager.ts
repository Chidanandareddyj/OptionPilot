import { createApiFetch, type ApiFetch } from "./apiFetch";
import type { AccountSession, AuthApi, LinkedAccount, Organization, SessionInfo } from "./authApi";
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

  /** Runs a call on the signed-in session. A 401 means the session is over, as it does for `apiFetch`. */
  async function onSession<T>(run: (call: ReturnType<SessionStrategy["sessionCall"]>) => Promise<T>): Promise<T> {
    const call = strategy?.sessionCall();
    if (!call) throw new SignedOutError();
    try {
      return await run(call);
    } catch (error) {
      if (error instanceof AuthError && error.status === 401) {
        void end().then(() => onSignedOut?.());
        throw new SignedOutError();
      }
      throw error;
    }
  }

  /** Keeps the stored identity (name and email) in step with what the server now says. */
  async function remember(patch: Partial<Pick<AuthUser, "name" | "email">>): Promise<AuthUser | null> {
    if (!user) return null;
    user = { ...user, ...patch };
    const stored = await store.load();
    if (stored) await store.save({ ...stored, user: { ...stored.user, ...patch } });
    return user;
  }

  /** The calls Settings makes on the signed-in session. Each one ends the session on a 401. */
  const account = {
    session: (): Promise<AccountSession> => onSession((call) => api.getAccountSession(call)),
    async updateName(name: string): Promise<AuthUser | null> {
      await onSession((call) => api.updateUser(call, { name }));
      return remember({ name: name.trim() });
    },
    /** `null` removes the avatar. */
    updateImage: (image: string | null): Promise<void> => onSession((call) => api.updateUser(call, { image })),
    changeEmail: (newEmail: string): Promise<void> => onSession((call) => api.changeEmail(call, newEmail)),
    changePassword: (currentPassword: string, newPassword: string): Promise<void> =>
      onSession((call) => api.changePassword(call, { currentPassword, newPassword })),
    listAccounts: (): Promise<LinkedAccount[]> => onSession((call) => api.listAccounts(call)),
    listSessions: (): Promise<SessionInfo[]> => onSession((call) => api.listSessions(call)),
    revokeSession: (token: string): Promise<void> => onSession((call) => api.revokeSession(call, token)),
    listOrganizations: (): Promise<Organization[]> => onSession((call) => api.listOrganizations(call)),
    createOrganization: (name: string, slug: string): Promise<void> =>
      onSession((call) => api.createOrganization(call, { name, slug })),
    deleteUser: (): Promise<void> => onSession((call) => api.deleteUser(call)),
  };

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
    account,

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
