import type { SessionCall } from "./authApi";
import type { TokenRefresher } from "./tokenRefresher";
import type { AuthMode } from "./types";

/**
 * How a signed-in session authenticates. The bearer and cookie implementations sit behind this one
 * interface, so `apiFetch` and the screens never care which one the server allowed.
 */
export interface SessionStrategy {
  readonly mode: AuthMode;
  /** Whether asking for fresh credentials after a 401 can change the outcome. */
  readonly refreshable: boolean;
  /** Adds the credentials for an app API call (`/api/*`). */
  authorize(init: RequestInit, options?: { force?: boolean }): Promise<RequestInit>;
  /** Credentials for a call on the auth session itself, such as sign-out. */
  sessionCall(): SessionCall;
  /** Forgets anything held in memory. */
  dispose(): void;
}

/** Session token in secure storage, exchanged for a 15 minute JWT that lives in memory. */
export function createBearerStrategy(sessionToken: string, refresher: TokenRefresher): SessionStrategy {
  return {
    mode: "bearer",
    refreshable: true,
    async authorize(init, { force = false } = {}) {
      const token = await refresher.getToken({ force });
      return {
        ...init,
        // Bearer calls never need the cookie jar, so keep any cookie out of them.
        credentials: "omit",
        headers: { ...(init.headers as Record<string, string>), authorization: `Bearer ${token}` },
      };
    },
    sessionCall: () => ({ sessionToken }),
    dispose: () => refresher.clear(),
  };
}

/** Fallback for a server that sets the session cookie but no `set-auth-token` header. */
export function createCookieStrategy(): SessionStrategy {
  return {
    mode: "cookie",
    refreshable: false,
    authorize: async (init) => ({ ...init, credentials: "include" }),
    sessionCall: () => ({ cookies: true }),
    dispose: () => {},
  };
}
