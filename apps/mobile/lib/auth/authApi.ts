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
  const { id, email, name, image } = value as JsonRecord;
  if (typeof id !== "string" || typeof email !== "string") return null;
  return {
    id,
    email,
    name: typeof name === "string" ? name : "",
    ...(typeof image === "string" && image ? { image } : {}),
  };
}

/** The signed-in user plus the id of the session that answered, so a sessions list can mark "this device". */
export type AccountSession = { user: AuthUser; sessionId: string | null };

/** A sign-in method linked to the account. `providerId` is "credential" for the email password. */
export type LinkedAccount = { id: string; providerId: string };

export type SessionInfo = {
  id: string;
  /** The server's token for this session. It is what `revokeSession` takes. */
  token: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string | null;
};

export type Organization = { id: string; name: string; slug: string; logo: string | null };

const text = (value: unknown): string | null => (typeof value === "string" && value.length > 0 ? value : null);

function asList(body: unknown): JsonRecord[] {
  return Array.isArray(body) ? body.filter((item): item is JsonRecord => !!item && typeof item === "object") : [];
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

  async function get(path: string, call: SessionCall): Promise<unknown> {
    const response = await request(path, { method: "GET", ...sessionInit(call) });
    if (!response.ok) throw await authErrorFromResponse(response);
    return response.json().catch(() => null);
  }

  /** A POST on the session. It uses the same credential rules as every other account call. */
  function postSession(path: string, body: JsonRecord, call: SessionCall): Promise<Response> {
    return post(path, body, sessionInit(call));
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

    /** The user with their avatar, and the id of this session. Throws when the session is not valid. */
    async getAccountSession(call: SessionCall): Promise<AccountSession> {
      const body = await get("/get-session", call);
      const record = body && typeof body === "object" ? (body as JsonRecord) : {};
      const user = toUser(record.user);
      if (!user) throw new AuthError("unknown", "Your session is no longer valid.", 401);
      const session = record.session && typeof record.session === "object" ? (record.session as JsonRecord) : {};
      return { user, sessionId: text(session.id) };
    },

    /** Changes the display name and/or the avatar. `image: null` removes the avatar. */
    async updateUser(call: SessionCall, patch: { name?: string; image?: string | null }): Promise<void> {
      await postSession("/update-user", { ...patch, ...(patch.name !== undefined ? { name: patch.name.trim() } : {}) }, call);
    },

    /** Asks the server to move the account to a new address. It is not changed until the address is confirmed. */
    async changeEmail(call: SessionCall, newEmail: string): Promise<void> {
      await postSession("/change-email", { newEmail: newEmail.trim() }, call);
    },

    async changePassword(call: SessionCall, input: { currentPassword: string; newPassword: string }): Promise<void> {
      await postSession("/change-password", { ...input, revokeOtherSessions: false }, call);
    },

    async listAccounts(call: SessionCall): Promise<LinkedAccount[]> {
      return asList(await get("/list-accounts", call)).flatMap((item) => {
        const id = text(item.id);
        const providerId = text(item.providerId);
        return id && providerId ? [{ id, providerId }] : [];
      });
    },

    async listSessions(call: SessionCall): Promise<SessionInfo[]> {
      return asList(await get("/list-sessions", call)).flatMap((item) => {
        const id = text(item.id);
        const token = text(item.token);
        if (!id || !token) return [];
        return [
          {
            id,
            token,
            userAgent: text(item.userAgent),
            ipAddress: text(item.ipAddress),
            createdAt: text(item.createdAt),
          },
        ];
      });
    },

    async revokeSession(call: SessionCall, token: string): Promise<void> {
      await postSession("/revoke-session", { token }, call);
    },

    async listOrganizations(call: SessionCall): Promise<Organization[]> {
      return asList(await get("/organization/list", call)).flatMap((item) => {
        const id = text(item.id);
        const name = text(item.name);
        const slug = text(item.slug);
        return id && name && slug ? [{ id, name, slug, logo: text(item.logo) }] : [];
      });
    },

    async createOrganization(call: SessionCall, input: { name: string; slug: string }): Promise<void> {
      await postSession("/organization/create", { name: input.name.trim(), slug: input.slug.trim() }, call);
    },

    /** Deletes the signed-in user at Neon Auth (`delete-user`). Throws when this deployment does not allow it. */
    async deleteUser(call: SessionCall): Promise<void> {
      await postSession("/delete-user", {}, call);
    },

    /** Ends the session on the server. The caller clears local state whatever this returns. */
    async signOut(call: SessionCall): Promise<void> {
      await post("/sign-out", {}, sessionInit(call));
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
