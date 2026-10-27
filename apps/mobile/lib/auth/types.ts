export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

/**
 * How requests prove who the person is.
 * - `bearer`: a session token kept in secure storage is exchanged for a short-lived JWT.
 * - `cookie`: the platform cookie jar carries the session cookie the server set at sign-in.
 */
export type AuthMode = "bearer" | "cookie";

export type StoredSession = {
  mode: AuthMode;
  /** The Better Auth session token from `set-auth-token`. Null in cookie mode. */
  sessionToken: string | null;
  user: AuthUser;
};
