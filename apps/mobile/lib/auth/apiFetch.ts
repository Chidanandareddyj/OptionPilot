import { SignedOutError } from "./errors";
import type { SessionStrategy } from "./strategy";

type FetchLike = typeof fetch;

export type ApiFetchOptions = {
  baseUrl: string;
  /** The strategy of the current session, or null when nobody is signed in. */
  getStrategy: () => SessionStrategy | null;
  /** Called once when a request shows the session is over. */
  onSignedOut: () => void;
  fetchImpl?: FetchLike;
};

/**
 * Redirects are not followed, because the web proxy answers an unauthenticated request with a
 * redirect to the sign-in page. A 401 and a redirect both mean the session is no longer valid.
 */
function isSignedOut(response: Response): boolean {
  return (
    response.status === 401 ||
    (response.status >= 300 && response.status < 400) ||
    response.type === "opaqueredirect" ||
    response.redirected
  );
}

/**
 * `fetch` for the OptionPilot API. It adds the session credentials, never follows redirects, and
 * throws {@link SignedOutError} (after calling `onSignedOut`) when the server stops accepting them.
 * A first 401 is retried once with freshly fetched credentials, because a JWT can run out between
 * the cache check and the server.
 */
export function createApiFetch({ baseUrl, getStrategy, onSignedOut, fetchImpl = fetch }: ApiFetchOptions) {
  const root = baseUrl.replace(/\/+$/, "");

  function signOutAndThrow(): never {
    onSignedOut();
    throw new SignedOutError();
  }

  return async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const strategy = getStrategy();
    if (!strategy) throw new SignedOutError();
    const url = /^https?:\/\//.test(path) ? path : `${root}${path.startsWith("/") ? "" : "/"}${path}`;

    async function attempt(force: boolean): Promise<Response> {
      let authorized: RequestInit;
      try {
        authorized = await strategy!.authorize(init, { force });
      } catch (error) {
        if (error instanceof SignedOutError) signOutAndThrow();
        throw error;
      }
      return fetchImpl(url, { ...authorized, redirect: "manual" });
    }

    const first = await attempt(false);
    if (!isSignedOut(first)) return first;
    if (!strategy.refreshable) signOutAndThrow();

    const second = await attempt(true);
    if (isSignedOut(second)) signOutAndThrow();
    return second;
  };
}

export type ApiFetch = ReturnType<typeof createApiFetch>;
