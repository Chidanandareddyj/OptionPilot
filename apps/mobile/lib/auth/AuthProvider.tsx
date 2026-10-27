import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createAuthApi, type AuthApi } from "./authApi";
import { getApiBaseUrl } from "./config";
import { createSessionManager, type SessionManager } from "./sessionManager";
import { ApiError } from "@/lib/api/client";
import { createSessionStore, type SessionStore } from "./sessionStore";
import type { AuthUser } from "./types";

export type AuthState = {
  /** False until the stored session has been read. */
  isReady: boolean;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Creates the account and emails a verification code. The person stays signed out. */
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  /** `fetch` for `/api/*` with the session credentials. Throws `SignedOutError` once signed out. */
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>;
  /** Settings calls on the signed-in session: profile, password, sessions, organizations, deletion. */
  account: SessionManager["account"];
  /** Changes the name and updates `user` everywhere. */
  updateName: (name: string) => Promise<void>;
  /**
   * Hard-deletes the account: saved analyses first, then the login. Resolves with `loginDeleted: false`
   * when the analyses are gone but the login could not be removed. The person stays signed in then.
   */
  deleteAccount: () => Promise<{ loginDeleted: boolean }>;
};

const AuthContext = createContext<AuthState | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  /** Tests inject these. The app uses secure storage and the configured API host. */
  api?: AuthApi;
  store?: SessionStore;
  baseUrl?: string;
};

export function AuthProvider({ children, api, store, baseUrl = getApiBaseUrl() }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  // The manager lives for the life of the provider and reports forced sign-outs, e.g. after a 401.
  const authApi = useMemo(() => api ?? createAuthApi({ baseUrl }), [api, baseUrl]);
  const manager = useMemo(
    () =>
      createSessionManager({
        api: authApi,
        store: store ?? createSessionStore(),
        baseUrl,
        onSignedOut: () => setUser(null),
      }),
    [authApi, store, baseUrl],
  );

  useEffect(() => {
    let cancelled = false;
    manager
      .restore()
      .then((restored) => {
        if (!cancelled) setUser(restored);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [manager]);

  const signIn = useCallback(
    async (email: string, password: string) => setUser(await manager.signIn(email, password)),
    [manager],
  );

  const signOut = useCallback(async () => {
    await manager.signOut();
    setUser(null);
  }, [manager]);

  const signUp = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      await authApi.signUp(input);
      // A failed first email is recoverable from the verify screen, which can send the code again.
      await authApi.sendVerificationOtp(input.email).catch(() => {});
      // Sign-up can open a session before the email is verified. Drop it, as the website does.
      await authApi.signOut({ cookies: true }).catch(() => {});
    },
    [authApi],
  );

  const resendVerificationCode = useCallback(
    async (email: string) => void (await authApi.sendVerificationOtp(email)),
    [authApi],
  );

  const verifyEmail = useCallback(
    async (email: string, code: string) => void (await authApi.verifyEmail(email, code)),
    [authApi],
  );

  const requestPasswordReset = useCallback(
    async (email: string) => void (await authApi.requestPasswordReset(email, `${baseUrl}/auth/reset-password`)),
    [authApi, baseUrl],
  );

  const updateName = useCallback(
    async (name: string) => {
      const next = await manager.account.updateName(name);
      if (next) setUser((current) => (current ? { ...current, name: next.name } : current));
    },
    [manager],
  );

  const deleteAccount = useCallback(async () => {
    const response = await manager.apiFetch("/api/account", { method: "DELETE" });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = body && typeof body === "object" ? (body as { error?: unknown }).error : null;
      throw new ApiError(typeof message === "string" ? message : "Could not delete your account.", response.status);
    }
    let loginDeleted = Boolean(body && typeof body === "object" && (body as { authUserDeleted?: unknown }).authUserDeleted === true);
    if (!loginDeleted) {
      // The server could not remove the login itself, so ask Neon Auth to do it for the signed-in user.
      loginDeleted = await manager.account.deleteUser().then(
        () => true,
        () => false,
      );
    }
    if (loginDeleted) {
      await manager.signOut();
      setUser(null);
    }
    return { loginDeleted };
  }, [manager]);

  const value = useMemo<AuthState>(
    () => ({
      isReady,
      user,
      signIn,
      signOut,
      signUp,
      resendVerificationCode,
      verifyEmail,
      requestPasswordReset,
      apiFetch: manager.apiFetch,
      account: manager.account,
      updateName,
      deleteAccount,
    }),
    [isReady, user, signIn, signOut, signUp, resendVerificationCode, verifyEmail, requestPasswordReset, manager, updateName, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
