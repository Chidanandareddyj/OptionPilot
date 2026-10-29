import assert from "node:assert/strict";
import { test } from "node:test";
import { createAlertsCronHandler, parseExpoPush, sendExpoPush, type AlertAnalysis, type PushMessage } from "./alerts-cron.ts";

const OPEN = new Date(Date.UTC(2026, 9, 26, 9, 16));
const CLOSED = new Date(Date.UTC(2026, 9, 24, 9, 16));
const TOKEN = "ExponentPushToken[phone]";

const analysis = (patch: Partial<AlertAnalysis> = {}): AlertAnalysis => ({
  id: "an-1",
  userId: "alice",
  company: "RELIANCE",
  result: { underlying_spot_price: 100, bull_call_spread: { breakeven: 110, lower_strike: 95, higher_strike: 115, spot_price: 100 } },
  decision: { best: { key: "bull_call_spread" } },
  ...patch,
});

function setup(options: { now?: Date; price?: number | null; sent?: Set<string>; pushOk?: boolean } = {}) {
  const recorded: { kind: string }[] = [];
  const dropped: string[] = [];
  const asked: string[][] = [];
  const pushed: PushMessage[] = [];
  const handle = createAlertsCronHandler({
    secret: "cron-secret",
    now: () => options.now ?? OPEN,
    devices: async () => [{ userId: "alice", token: TOKEN }],
    analyses: async (userIds) => (userIds.includes("alice") ? [analysis()] : []),
    prices: async (symbols) => {
      asked.push(symbols);
      const prices = new Map<string, number>();
      if (options.price != null) prices.set("RELIANCE", options.price);
      return prices;
    },
    sentKeys: async () => options.sent ?? new Set(),
    record: async (row) => {
      recorded.push(row);
    },
    push: async (messages) => {
      pushed.push(...messages);
      return messages.map(() => ({ ok: options.pushOk ?? true, drop: false }));
    },
    dropTokens: async (tokens) => {
      dropped.push(...tokens);
    },
  });
  const call = (secret?: string) =>
    handle(
      new Request("https://optionpilot.test/api/cron/alerts", {
        headers: secret === undefined ? undefined : { authorization: `Bearer ${secret}` },
      }),
    );
  return { recorded, dropped, asked, pushed, call };
}

test("the cron refuses a caller who does not know the secret", async () => {
  const { asked, call } = setup();
  assert.equal((await call()).status, 401);
  assert.equal((await call("nope")).status, 401);
  assert.equal(asked.length, 0);
});

test("outside market hours it sends nothing", async () => {
  const { asked, pushed, call } = setup({ now: CLOSED, price: 120 });
  const response = await call("cron-secret");
  assert.deepEqual(await response.json(), { sent: 0, skipped: "closed" });
  assert.equal(asked.length, 0);
  assert.equal(pushed.length, 0);
});

test("a move past 2% is sent once, and a repeat the same day is not", async () => {
  const first = setup({ price: 103 });
  const response = await first.call("cron-secret");
  assert.equal((await response.json()).sent, 1);
  assert.equal(first.recorded[0]?.kind, "move");
  assert.equal(first.pushed[0]?.title, "RELIANCE moved 3.0%");
  assert.equal(first.asked[0]?.[0], "RELIANCE");

  const again = setup({ price: 103, sent: new Set(["alice\tan-1\tmove"]) });
  assert.equal((await (await again.call("cron-secret")).json()).sent, 0);
  assert.equal(again.pushed.length, 0);
});

test("a price inside 2% that has not crossed a breakeven sends nothing", async () => {
  const { recorded, pushed, call } = setup({ price: 101 });
  assert.equal((await (await call("cron-secret")).json()).sent, 0);
  assert.equal(recorded.length, 0);
  assert.equal(pushed.length, 0);
});

test("crossing a breakeven is its own alert", async () => {
  const { recorded, pushed, call } = setup({ price: 112 });
  assert.equal((await (await call("cron-secret")).json()).sent, 2);
  assert.deepEqual(recorded.map((row) => row.kind).sort(), ["breakeven", "move"]);
  assert.equal(pushed[0]?.title, "RELIANCE crossed a breakeven");
});

test("a missing quote sends nothing and invents no price", async () => {
  const { recorded, call } = setup({ price: null });
  assert.equal((await (await call("cron-secret")).json()).sent, 0);
  assert.equal(recorded.length, 0);
});

test("a refused push is not recorded, so the next run can retry", async () => {
  const { recorded, call } = setup({ price: 103, pushOk: false });
  assert.equal((await (await call("cron-secret")).json()).sent, 0);
  assert.equal(recorded.length, 0);
});

test("parseExpoPush keeps a dead token out of the retry and retries a failed request", () => {
  assert.deepEqual(
    parseExpoPush({ data: [{ status: "ok" }, { status: "error", details: { error: "DeviceNotRegistered" } }] }, 2),
    [{ ok: true, drop: false }, { ok: false, drop: true }],
  );
  assert.deepEqual(parseExpoPush(null, 1), [{ ok: false, drop: false }]);
});

test("sendExpoPush posts the Expo body and treats a network failure as unsent", async () => {
  const calls: { url: string; body: string }[] = [];
  const ok = await sendExpoPush(
    [{ to: TOKEN, title: "T", body: "B", sound: "default", data: { analysisId: "an-1" } }],
    (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), body: String(init?.body) });
      return new Response(JSON.stringify({ data: [{ status: "ok" }] }), { status: 200 });
    }) as typeof fetch,
  );
  assert.deepEqual(ok, [{ ok: true, drop: false }]);
  assert.equal(calls[0]?.url, "https://exp.host/--/api/v2/push/send");
  assert.match(calls[0]?.body ?? "", /ExponentPushToken/);

  const failed = await sendExpoPush(
    [{ to: TOKEN, title: "T", body: "B", sound: "default", data: { analysisId: "an-1" } }],
    (async () => {
      throw new TypeError("offline");
    }) as typeof fetch,
  );
  assert.deepEqual(failed, [{ ok: false, drop: false }]);
});
