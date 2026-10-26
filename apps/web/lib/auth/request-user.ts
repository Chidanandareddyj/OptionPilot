import { requireUserId, UnauthorizedError } from "@optionpilot/shared";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { readBearerHeader } from "./bearer";

// Neon Auth JWTs are EdDSA and stay valid until `exp` (15 minutes). Sign-out does
// not revoke one that was already issued. Callers must treat that lag as acceptable.

type SessionData = { user?: { id?: string } | null } | null | undefined;

export type CookieSessionReader = () => Promise<SessionData>;

let cachedJwksUrl: string | undefined;
let cachedJwks: JWTVerifyGetKey | undefined;

function jwks(url: string): JWTVerifyGetKey {
  if (cachedJwks && cachedJwksUrl === url) return cachedJwks;
  cachedJwksUrl = url;
  cachedJwks = createRemoteJWKSet(new URL(url));
  return cachedJwks;
}

async function userIdFromBearer(token: string): Promise<string> {
  const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!jwksUrl || !baseUrl || !token) throw new UnauthorizedError();

  let issuer: string;
  try {
    issuer = new URL(baseUrl).origin;
  } catch {
    throw new UnauthorizedError();
  }

  try {
    const { payload } = await jwtVerify(token, jwks(jwksUrl), {
      issuer,
      algorithms: ["EdDSA"],
    });
    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      throw new UnauthorizedError();
    }
    return payload.sub;
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError();
  }
}

async function defaultCookieSession(): Promise<SessionData> {
  const { auth } = await import("@/lib/auth/server");
  const { data: session } = await auth.getSession();
  return session;
}

export async function getRequestUserId(
  request: Request,
  readCookieSession: CookieSessionReader = defaultCookieSession,
): Promise<string> {
  const bearer = readBearerHeader(request.headers.get("authorization"));
  if (bearer.present) return userIdFromBearer(bearer.token);

  const session = await readCookieSession();
  return requireUserId(session);
}
