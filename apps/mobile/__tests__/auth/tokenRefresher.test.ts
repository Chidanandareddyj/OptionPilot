import { createTokenRefresher, jwtExpiryMs } from "@/lib/auth/tokenRefresher";
import { makeJwt } from "./helpers";

const NOW = 1_800_000_000_000;

describe("jwtExpiryMs", () => {
  it("reads exp as milliseconds", () => {
    expect(jwtExpiryMs(makeJwt(1_800_000_900))).toBe(1_800_000_900_000);
  });

  it("returns null for anything that is not a JWT with an exp", () => {
    expect(jwtExpiryMs("not-a-jwt")).toBeNull();
    expect(jwtExpiryMs("a.%%%.c")).toBeNull();
    expect(jwtExpiryMs(`a.${btoa(JSON.stringify({ sub: "x" }))}.c`)).toBeNull();
  });
});

describe("createTokenRefresher", () => {
  function setup(lifetimeSeconds = 900) {
    let clock = NOW;
    let issued = 0;
    const fetchJwt = jest.fn(async () => makeJwt(clock / 1000 + lifetimeSeconds, { n: ++issued }));
    const refresher = createTokenRefresher({ fetchJwt, now: () => clock });
    return { refresher, fetchJwt, advance: (ms: number) => void (clock += ms) };
  }

  it("fetches once and reuses the token while it has more than 60 s left", async () => {
    const { refresher, fetchJwt, advance } = setup();
    const first = await refresher.getToken();
    advance(14 * 60_000 - 1_000); // 15 min lifetime, 61 s left
    expect(await refresher.getToken()).toBe(first);
    expect(fetchJwt).toHaveBeenCalledTimes(1);
  });

  it("refreshes once fewer than 60 s remain", async () => {
    const { refresher, fetchJwt, advance } = setup();
    const first = await refresher.getToken();
    advance(14 * 60_000 + 1_000); // 59 s left
    const second = await refresher.getToken();
    expect(second).not.toBe(first);
    expect(fetchJwt).toHaveBeenCalledTimes(2);
  });

  it("shares one request between simultaneous callers", async () => {
    const { refresher, fetchJwt } = setup();
    const [a, b, c] = await Promise.all([refresher.getToken(), refresher.getToken(), refresher.getToken()]);
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(fetchJwt).toHaveBeenCalledTimes(1);
  });

  it("fetches again when forced", async () => {
    const { refresher, fetchJwt } = setup();
    await refresher.getToken();
    await refresher.getToken({ force: true });
    expect(fetchJwt).toHaveBeenCalledTimes(2);
  });

  it("passes a failure to the caller and tries again on the next call", async () => {
    const { refresher, fetchJwt } = setup();
    fetchJwt.mockRejectedValueOnce(new Error("offline"));
    await expect(refresher.getToken()).rejects.toThrow("offline");
    await expect(refresher.getToken()).resolves.toEqual(expect.any(String));
  });

  it("forgets the token on clear, even one that was still being fetched", async () => {
    const { refresher, fetchJwt } = setup();
    await refresher.getToken();
    refresher.clear();
    await refresher.getToken();
    expect(fetchJwt).toHaveBeenCalledTimes(2);

    let release: (token: string) => void = () => {};
    fetchJwt.mockImplementationOnce(() => new Promise<string>((resolve) => (release = resolve)));
    refresher.clear();
    const pending = refresher.getToken();
    refresher.clear();
    release(makeJwt(NOW / 1000 + 900));
    await pending;
    await refresher.getToken();
    expect(fetchJwt).toHaveBeenCalledTimes(4); // the late result was not cached
  });

  it("trusts a token with no exp for five minutes", async () => {
    let clock = NOW;
    const fetchJwt = jest.fn(async () => "opaque-token");
    const refresher = createTokenRefresher({ fetchJwt, now: () => clock });
    await refresher.getToken();
    clock += 3 * 60_000;
    await refresher.getToken();
    expect(fetchJwt).toHaveBeenCalledTimes(1);
    clock += 2 * 60_000;
    await refresher.getToken();
    expect(fetchJwt).toHaveBeenCalledTimes(2);
  });
});
