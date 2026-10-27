/** Refresh the JWT when less than this is left on it. */
export const REFRESH_SKEW_MS = 60_000;

/** Used when a token carries no readable `exp`: trust it for this long. */
const UNKNOWN_LIFETIME_MS = 5 * 60_000;

/** The `exp` claim of a JWT in milliseconds, or null. The signature is not checked here. */
export function jwtExpiryMs(jwt: string): number | null {
  const payload = jwt.split(".")[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const exp: unknown = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export type TokenRefresherOptions = {
  /** Gets a fresh JWT, e.g. by exchanging the session token. */
  fetchJwt: () => Promise<string>;
  now?: () => number;
  skewMs?: number;
};

/**
 * Keeps the access JWT in memory only. `getToken` hands back the cached token while it has more than
 * `skewMs` left and otherwise fetches a new one. Calls made during a fetch share it.
 */
export function createTokenRefresher({
  fetchJwt,
  now = Date.now,
  skewMs = REFRESH_SKEW_MS,
}: TokenRefresherOptions) {
  let cached: { token: string; expiresAt: number } | null = null;
  let inflight: Promise<string> | null = null;
  let generation = 0;

  async function refresh(): Promise<string> {
    const startedIn = generation;
    const token = await fetchJwt();
    // A clear() while the request was out means the person signed out: drop the result.
    if (startedIn === generation) {
      cached = { token, expiresAt: jwtExpiryMs(token) ?? now() + UNKNOWN_LIFETIME_MS };
    }
    return token;
  }

  return {
    async getToken({ force = false }: { force?: boolean } = {}): Promise<string> {
      if (!force && cached && cached.expiresAt - now() > skewMs) return cached.token;
      if (!inflight) {
        inflight = refresh().finally(() => {
          inflight = null;
        });
      }
      return inflight;
    },

    /** Forget the token, e.g. on sign-out. */
    clear(): void {
      generation += 1;
      cached = null;
      inflight = null;
    },
  };
}

export type TokenRefresher = ReturnType<typeof createTokenRefresher>;
