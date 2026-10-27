import assert from "node:assert/strict";
import { createServer, type AddressInfo, type Server } from "node:http";
import { after, before, test } from "node:test";
import { exportJWK, generateKeyPair, SignJWT, type CryptoKey, type JWK } from "jose";
import { UnauthorizedError } from "@optionpilot/shared";
import { readBearerHeader } from "./bearer.ts";
import { getRequestUserId } from "./request-user.ts";

const ISSUER = "https://auth.example.test";

let server: Server;
let privateKey: CryptoKey;
let otherPrivateKey: CryptoKey;

before(async () => {
  const primary = await generateKeyPair("EdDSA", { crv: "Ed25519" });
  const other = await generateKeyPair("EdDSA", { crv: "Ed25519" });
  privateKey = primary.privateKey;
  otherPrivateKey = other.privateKey;
  const jwk = await exportJWK(primary.publicKey);
  jwk.alg = "EdDSA";
  jwk.kid = "test-key";
  jwk.use = "sig";

  server = createServer((req, res) => {
    const body = JSON.stringify({ keys: [jwk satisfies JWK] });
    res.writeHead(200, { "content-type": "application/json" });
    res.end(body);
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  process.env.NEON_AUTH_JWKS_URL = `http://127.0.0.1:${port}/jwks`;
  process.env.NEON_AUTH_BASE_URL = ISSUER;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

async function sign(options?: {
  sub?: string | null;
  issuer?: string;
  expiresIn?: string | number;
  key?: CryptoKey;
}) {
  const claims = new SignJWT({});
  claims.setProtectedHeader({ alg: "EdDSA", kid: "test-key" });
  claims.setIssuer(options?.issuer ?? ISSUER);
  claims.setIssuedAt();
  claims.setExpirationTime(options?.expiresIn ?? "15m");
  if (options?.sub !== null) claims.setSubject(options?.sub ?? "user-1");
  return claims.sign(options?.key ?? privateKey);
}

function request(authorization?: string) {
  return new Request("https://optionpilot.test/api/decide", {
    headers: authorization === undefined ? undefined : { authorization },
  });
}

test("readBearerHeader ignores anything that is not a bearer scheme", () => {
  assert.deepEqual(readBearerHeader(null), { present: false });
  assert.deepEqual(readBearerHeader("Basic abc"), { present: false });
  assert.deepEqual(readBearerHeader("Bearer token-1"), { present: true, token: "token-1" });
  assert.deepEqual(readBearerHeader("bearer token-1"), { present: true, token: "token-1" });
  assert.deepEqual(readBearerHeader("Bearer"), { present: true, token: "" });
});

test("no Authorization header uses the cookie session", async () => {
  let calls = 0;
  const userId = await getRequestUserId(request(), async () => {
    calls += 1;
    return { user: { id: "cookie-user" } };
  });
  assert.equal(userId, "cookie-user");
  assert.equal(calls, 1);
});

test("a cookie session without a user id is unauthorized", async () => {
  await assert.rejects(
    () => getRequestUserId(request(), async () => ({ user: null })),
    UnauthorizedError,
  );
});

test("a valid bearer token returns sub and does not read cookies", async () => {
  const token = await sign({ sub: "jwt-user" });
  let calls = 0;
  const userId = await getRequestUserId(request(`Bearer ${token}`), async () => {
    calls += 1;
    return { user: { id: "cookie-user" } };
  });
  assert.equal(userId, "jwt-user");
  assert.equal(calls, 0);
});

test("an empty bearer token does not fall back to cookies", async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      getRequestUserId(request("Bearer"), async () => {
        calls += 1;
        return { user: { id: "cookie-user" } };
      }),
    UnauthorizedError,
  );
  assert.equal(calls, 0);
});

test("a bearer token signed by the wrong key is unauthorized", async () => {
  const token = await sign({ key: otherPrivateKey });
  await assert.rejects(() => getRequestUserId(request(`Bearer ${token}`), async () => null), UnauthorizedError);
});

test("an expired bearer token is unauthorized", async () => {
  const token = await sign({ expiresIn: "-1m" });
  await assert.rejects(() => getRequestUserId(request(`Bearer ${token}`), async () => null), UnauthorizedError);
});

test("a bearer token with the wrong issuer is unauthorized", async () => {
  const token = await sign({ issuer: "https://other.example" });
  await assert.rejects(() => getRequestUserId(request(`Bearer ${token}`), async () => null), UnauthorizedError);
});

test("a bearer token without sub is unauthorized", async () => {
  const token = await sign({ sub: null });
  await assert.rejects(() => getRequestUserId(request(`Bearer ${token}`), async () => null), UnauthorizedError);
});

test("bearer verification fails closed when NEON_AUTH_JWKS_URL is unset", async () => {
  const token = await sign();
  const previous = process.env.NEON_AUTH_JWKS_URL;
  delete process.env.NEON_AUTH_JWKS_URL;
  try {
    await assert.rejects(() => getRequestUserId(request(`Bearer ${token}`), async () => null), UnauthorizedError);
  } finally {
    process.env.NEON_AUTH_JWKS_URL = previous;
  }
});
