import { createAuthApi } from "@/lib/auth/authApi";
import { AuthError, SignedOutError } from "@/lib/auth/errors";
import { jsonResponse, USER } from "./helpers";

const BASE = "https://www.optionpilot.tech";

function setup() {
  const fetchImpl = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
  return { api: createAuthApi({ baseUrl: `${BASE}/`, fetchImpl }), fetchImpl };
}

function call(fetchImpl: jest.Mock, index = 0) {
  const [url, init] = fetchImpl.mock.calls[index] as [string, RequestInit];
  return { url, init, headers: init.headers as Record<string, string>, body: init.body ? JSON.parse(init.body as string) : undefined };
}

describe("signIn", () => {
  it("posts the credentials to the www host and reads the session token header", async () => {
    const { api, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ user: USER, token: "raw" }, { headers: { "set-auth-token": "signed.token" } }));

    const result = await api.signIn("  asha@example.com ", "hunter22!");

    expect(result).toEqual({ user: USER, sessionToken: "signed.token" });
    const { url, init, body } = call(fetchImpl);
    expect(url).toBe(`${BASE}/api/auth/sign-in/email`);
    expect(init.method).toBe("POST");
    expect(init.redirect).toBe("manual");
    expect(body).toEqual({ email: "asha@example.com", password: "hunter22!" });
  });

  it("returns a null session token when the header is missing", async () => {
    const { api, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ user: USER }));
    expect((await api.signIn("asha@example.com", "pw")).sessionToken).toBeNull();
  });

  it.each([
    [401, { code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid email or password" }, "invalid-credentials"],
    [403, { code: "EMAIL_NOT_VERIFIED", message: "Email not verified" }, "email-not-verified"],
    [429, {}, "too-many-requests"],
    [403, { code: "INVALID_ORIGIN", message: "Invalid origin" }, "unknown"],
    [500, null, "unknown"],
  ])("maps a %s answer to %s", async (status, body, code) => {
    const { api, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse(body, { status }));
    await expect(api.signIn("a@b.co", "pw")).rejects.toMatchObject({ name: "AuthError", code });
  });

  it("words a failed request as a connection problem", async () => {
    const { api, fetchImpl } = setup();
    fetchImpl.mockRejectedValue(new TypeError("Network request failed"));
    const error = await api.signIn("a@b.co", "pw").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AuthError);
    expect(error).toMatchObject({ code: "network" });
  });
});

describe("sign-up, codes and reset", () => {
  it("sign-up sends name, email and password", async () => {
    const { api, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ user: USER }));
    await api.signUp({ name: " Asha ", email: "asha@example.com", password: "hunter22!" });
    const { url, body } = call(fetchImpl);
    expect(url).toBe(`${BASE}/api/auth/sign-up/email`);
    expect(body).toEqual({ name: "Asha", email: "asha@example.com", password: "hunter22!" });
  });

  it("reports an existing account", async () => {
    const { api, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ code: "USER_ALREADY_EXISTS" }, { status: 422 }));
    await expect(api.signUp({ name: "A", email: "a@b.co", password: "pw" })).rejects.toMatchObject({ code: "user-exists" });
  });

  it("asks for and verifies an email code", async () => {
    const { api, fetchImpl } = setup();
    fetchImpl.mockImplementation(async () => jsonResponse({ status: true }));
    await api.sendVerificationOtp("asha@example.com");
    await api.verifyEmail("asha@example.com", "482915");
    expect(call(fetchImpl, 0)).toMatchObject({
      url: `${BASE}/api/auth/email-otp/send-verification-otp`,
      body: { email: "asha@example.com", type: "email-verification" },
    });
    expect(call(fetchImpl, 1)).toMatchObject({
      url: `${BASE}/api/auth/email-otp/verify-email`,
      body: { email: "asha@example.com", otp: "482915" },
    });
  });

  it.each([
    ["INVALID_OTP", "invalid-code"],
    ["OTP_EXPIRED", "expired-code"],
    ["TOO_MANY_ATTEMPTS", "too-many-requests"],
  ])("maps %s to %s", async (serverCode, code) => {
    const { api, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ code: serverCode }, { status: 400 }));
    await expect(api.verifyEmail("a@b.co", "000000")).rejects.toMatchObject({ code });
  });

  it("requests a reset link that lands on the web reset page", async () => {
    const { api, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ status: true }));
    await api.requestPasswordReset("asha@example.com", `${BASE}/auth/reset-password`);
    expect(call(fetchImpl)).toMatchObject({
      url: `${BASE}/api/auth/request-password-reset`,
      body: { email: "asha@example.com", redirectTo: `${BASE}/auth/reset-password` },
    });
  });
});

describe("fetchJwt", () => {
  it("exchanges the session token for the JWT", async () => {
    const { api, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ token: "a.b.c" }));
    await expect(api.fetchJwt("signed.token")).resolves.toBe("a.b.c");
    const { url, init, headers } = call(fetchImpl);
    expect(url).toBe(`${BASE}/api/auth/token`);
    expect(init.method).toBe("GET");
    expect(init.credentials).toBe("omit");
    expect(headers.authorization).toBe("Bearer signed.token");
  });

  it("treats a 401 or a redirect as signed out", async () => {
    const { api, fetchImpl } = setup();
    fetchImpl.mockResolvedValueOnce(new Response(null, { status: 401 }));
    await expect(api.fetchJwt("t")).rejects.toBeInstanceOf(SignedOutError);
    fetchImpl.mockResolvedValueOnce(new Response(null, { status: 302 }));
    await expect(api.fetchJwt("t")).rejects.toBeInstanceOf(SignedOutError);
  });

  it("rejects an answer without a token", async () => {
    const { api, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({}));
    await expect(api.fetchJwt("t")).rejects.toMatchObject({ code: "unknown" });
  });
});

describe("getSession and signOut", () => {
  it("reads the user through the cookie jar", async () => {
    const { api, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ session: {}, user: USER }));
    await expect(api.getSession({ cookies: true })).resolves.toEqual(USER);
    expect(call(fetchImpl).init.credentials).toBe("include");
  });

  it("returns null when there is no session", async () => {
    const { api, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse(null));
    await expect(api.getSession({ cookies: true })).resolves.toBeNull();
  });

  it("signs out with the session token as a Bearer header", async () => {
    const { api, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ success: true }));
    await api.signOut({ sessionToken: "signed.token" });
    const { url, headers, init } = call(fetchImpl);
    expect(url).toBe(`${BASE}/api/auth/sign-out`);
    expect(headers.authorization).toBe("Bearer signed.token");
    expect(init.credentials).toBe("omit");
  });
});
