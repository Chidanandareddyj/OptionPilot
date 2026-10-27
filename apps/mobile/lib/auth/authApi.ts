import { AuthError, NETWORK_MESSAGE, SignedOutError, authErrorFromResponse } from "./errors";
import type { AuthUser } from "./types";

type FetchLike = typeof fetch;

export type AuthApiOptions = {
  /** The web app origin, e.g. `https://www.optionpilot.tech`. The `/api/auth` prefix is added here. */
  baseUrl: string;
  fetchImpl?: FetchLike;
};

export type SignInResult = {
  user: AuthUser;
  /** From the `set-auth-token` response header. Null when the server did not send one. */
  sessionToken: string | null;
};

/**
 * Credentials for a call on the signed-in session: the session token as a Bearer header in bearer
 * mode, or the cookie jar in cookie mode.
 */
export type SessionCall = { sessionToken: string } | { cookies: true };

type JsonRecord = Record<string, unknown>;

function toUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== "object") return null;
  const { id, email, name } = value as JsonRecord;
  if (typeof id !== "string" || typeof email !== "string") return null;
  return { id, email, name: typeof name === "string" ? name : "" };
}

/** The Neon Auth (Better Auth) endpoints that the web app proxies at `/api/auth/*`. */
export function createAuthApi({ baseUrl, fetchImpl = fetch }: AuthApiOptions) {
  const root = `${baseUrl.replace(/\/+$/, "")}/api/auth`;

  async function request(path: string, init: RequestInit): Promise<Response> {
    try {
      return await fetchImpl(`${root}${path}`, {
        ...init,
        headers: { accept: "application/json", ...(init.headers as Record<string, string>) },
        redirect: "manual",
      });
    } catch {
      throw new AuthError("network", NETWORK_MESSAGE);
    }
  }

  async function post(path: string, body: JsonRecord, extra: RequestInit = {}): Promise<Response> {
    const response = await request(path, {
      method: "POST",
      credentials: "include",
      ...extra,
      headers: { "content-type": "application/json", ...(extra.headers as Record<string, string>) },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw await authErrorFromResponse(response);
    return response;
  }

  function sessionInit(call: SessionCall): RequestInit {
    return "sessionToken" in call
      ? { credentials: "omit", headers: { authorization: `Bearer ${call.sessionToken}` } }
      : { credentials: "include" };
  }

  return {
    /** Email and password sign-in. Reads the session token from the `set-auth-token` header. */
    async signIn(email: string, password: string): Promise<SignInResult> {
      const response = await post("/sign-in/email", { email: email.trim(), password });
      const body: unknown = await response.json().catch(() => null);
      const user = toUser(body && typeof body === "object" ? (body as JsonRecord).user : null);
      if (!user) throw new AuthError("unknown", "Signed in, but the server reply was not understood.");
      return { user, sessionToken: response.headers.get("set-auth-token") };
    },

    /** Creates the account. The caller still has to verify the email with a code. */
    async signUp(input: { name: string; email: string; password: string }): Promise<void> {
      await post("/sign-up/email", { ...input, name: input.name.trim(), email: input.email.trim() });
    },

    sendVerificationOtp(email: string): Promise<Response> {
      return post("/email-otp/send-verification-otp", { email: email.trim(), type: "email-verification" });
    },

    verifyEmail(email: string, otp: string): Promise<Response> {
      return post("/email-otp/verify-email", { email: email.trim(), otp });
    },

    /** Emails a reset link. `redirectTo` is the web page that takes the new password. */
    requestPasswordReset(email: string, redirectTo: string): Promise<Response> {
      return post("/request-password-reset", { email: email.trim(), redirectTo });
    },

    /** Exchanges the stored session token for the short-lived JWT used on API calls. */
    async fetchJwt(sessionToken: string): Promise<string> {
      const response = await request("/token", {
        method: "GET",
        credentials: "omit",
        headers: { authorization: `Bearer ${sessionToken}` },
      });
      if (response.status === 401 || (response.status >= 300 && response.status < 400)) {
        throw new SignedOutError();
      }
      if (!response.ok) throw await authErrorFromResponse(response);
      const body: unknown = await response.json().catch(() => null);
      const token = body && typeof body === "object" ? (body as JsonRecord).token : null;
      if (typeof token !== "string" || token.length === 0) {
        throw new AuthError("unknown", "The server did not return an access token.");
      }
      return token;
    },

    /** The user behind the session, or null when it is not valid. Used by cookie mode. */
    async getSession(call: SessionCall): Promise<AuthUser | null> {
      const response = await request("/get-session", { method: "GET", ...sessionInit(call) });
      if (!response.ok) return null;
      const body: unknown = await response.json().catch(() => null);
      return toUser(body && typeof body === "object" ? (body as JsonRecord).user : null);
    },

    /** Ends the session on the server. The caller clears local state whatever this returns. */
    async signOut(call: SessionCall): Promise<void> {
      await post("/sign-out", {}, sessionInit(call));
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
