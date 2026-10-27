/** What went wrong, in terms the sign-in screens can react to. */
export type AuthErrorCode =
  | "invalid-credentials"
  | "email-not-verified"
  | "user-exists"
  | "invalid-code"
  | "expired-code"
  | "too-many-requests"
  | "network"
  | "unknown";

/** A failed auth call. `message` is already worded for the person using the app. */
export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly status?: number;

  constructor(code: AuthErrorCode, message: string, status?: number) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
  }
}

/** The session is gone or was rejected, so the person has to sign in again. */
export class SignedOutError extends Error {
  constructor(message = "You are signed out.") {
    super(message);
    this.name = "SignedOutError";
  }
}

export const NETWORK_MESSAGE = "Could not reach OptionPilot. Check your connection and try again.";

const MESSAGES: Record<Exclude<AuthErrorCode, "network" | "unknown">, string> = {
  "invalid-credentials":
    "Incorrect email or password. Check both and try again, or reset your password.",
  "email-not-verified": "Verify your email before signing in. We can send you a new code.",
  "user-exists": "An account with this email already exists. Sign in instead.",
  "invalid-code": "That code is not right. Check it and try again.",
  "expired-code": "That code has expired. Send a new one and try again.",
  "too-many-requests": "Too many attempts. Wait a minute and try again.",
};

/**
 * Better Auth sends `{ code, message }`. Match on the code first and on the status as a fallback.
 * A bare 403 is not read as "unverified": it is also what a rejected Origin looks like.
 */
function codeFor(status: number, serverCode: string | undefined): Exclude<AuthErrorCode, "network"> {
  switch (serverCode) {
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_PASSWORD":
      return "invalid-credentials";
    case "EMAIL_NOT_VERIFIED":
      return "email-not-verified";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "user-exists";
    case "INVALID_OTP":
      return "invalid-code";
    case "OTP_EXPIRED":
      return "expired-code";
    case "TOO_MANY_ATTEMPTS":
      return "too-many-requests";
  }
  if (status === 429) return "too-many-requests";
  if (status === 401) return "invalid-credentials";
  return "unknown";
}

/** Turns a non-2xx auth response into an {@link AuthError}. */
export async function authErrorFromResponse(response: Response): Promise<AuthError> {
  let serverCode: string | undefined;
  let serverMessage: string | undefined;
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object") {
      const record = body as { code?: unknown; message?: unknown };
      if (typeof record.code === "string") serverCode = record.code;
      if (typeof record.message === "string") serverMessage = record.message;
    }
  } catch {
    // An empty or non-JSON body leaves the status to decide.
  }
  const code = codeFor(response.status, serverCode);
  if (code === "unknown") {
    return new AuthError("unknown", serverMessage ?? "Something went wrong. Try again.", response.status);
  }
  return new AuthError(code, MESSAGES[code], response.status);
}
