import type { Company, ConnState, RelayTick } from "@optionpilot/shared";
import {
  MAX_STREAM_MS,
  REFRESH_TIMEOUT_MS,
  RelayStream,
  STREAM_RETRY_MS,
  TOKEN_RETRY_MS,
  WATCHDOG_MS,
  backoffMs,
  type StreamSource,
} from "@/lib/derivatives/stream";

type Listener = (event: { data?: string | null; type?: string }) => void;

/** An EventSource double: tests push events into it as the relay would. */
class FakeSource implements StreamSource {
  static all: FakeSource[] = [];
  closed = false;
  private listeners = new Map<string, Listener[]>();
  constructor(readonly url: string) {
    FakeSource.all.push(this);
  }
  addEventListener(type: string, listener: Listener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  close() {
    this.closed = true;
  }
  emit(type: string, data?: unknown) {
    const payload = typeof data === "string" ? data : data === undefined ? null : JSON.stringify(data);
    (this.listeners.get(type) ?? []).forEach((listener) => listener({ type, data: payload }));
  }
}

const company: Company = { k: "A", s: "AAA", n: "Aaa", e: "2026-10-27", l: 100, strikes: [90, 100, 110] };
const tick = (now = 1): RelayTick => ({ rows: [{ k: "A", sp: 100, w: [[100, 7, now, 6, now]] }], live: true, status: "NORMAL_OPEN", now });
const last = () => FakeSource.all[FakeSource.all.length - 1];

function setup(fetchToken?: () => Promise<{ url: string; token: string }>) {
  let issued = 0;
  const tokens = jest.fn(
    fetchToken ??
      (async () => {
        issued += 1;
        return { url: "https://relay.test/", token: `t${issued}.sig` };
      }),
  );
  const log = { conn: [] as ConnState[], errors: [] as (string | null)[], ticks: [] as RelayTick[], universes: [] as Company[][] };
  const stream = new RelayStream(
    { fetchToken: tokens, createSource: (url) => new FakeSource(url) },
    {
      onUniverse: (companies) => log.universes.push(companies),
      onTick: (t) => log.ticks.push(t),
      onConn: (c) => log.conn.push(c),
      onError: (e) => log.errors.push(e),
    },
  );
  return { stream, tokens, log };
}

/** Lets the token promise settle. */
const flush = async () => {
  await jest.advanceTimersByTimeAsync(0);
};

beforeEach(() => {
  jest.useFakeTimers();
  FakeSource.all = [];
});
afterEach(() => {
  jest.useRealTimers();
});

test("backoff doubles from its base and stops at half a minute", () => {
  expect([0, 1, 2, 3, 4, 5].map((n) => backoffMs(STREAM_RETRY_MS, n))).toEqual([3000, 6000, 12000, 24000, 30000, 30000]);
  expect(backoffMs(TOKEN_RETRY_MS, 1)).toBe(10_000);
});

test("connects with a fresh token, passes the universe and ticks on, and reports open", async () => {
  const { stream, log, tokens } = setup();
  stream.start();
  expect(log.conn).toEqual(["connecting"]);
  await flush();
  expect(tokens).toHaveBeenCalledTimes(1);
  expect(last().url).toBe("https://relay.test/stream?token=t1.sig");
  last().emit("universe", [company]);
  last().emit("tick", tick(5));
  expect(log.universes).toEqual([[company]]);
  expect(log.ticks).toEqual([tick(5)]);
  expect(log.conn).toEqual(["connecting", "open"]);
  expect(log.errors).toEqual([null]);
  stream.stop();
});

test("starting twice opens one stream", async () => {
  const { stream, tokens } = setup();
  stream.start();
  stream.start();
  await flush();
  expect(tokens).toHaveBeenCalledTimes(1);
  expect(FakeSource.all).toHaveLength(1);
  stream.stop();
});

test("a dropped stream reconnects after 3 seconds with a new token, and again with longer waits", async () => {
  const { stream, log, tokens } = setup();
  stream.start();
  await flush();
  last().emit("tick", tick());
  const first = last();
  first.emit("error");
  expect(first.closed).toBe(true);
  expect(log.conn.at(-1)).toBe("reconnecting");

  await jest.advanceTimersByTimeAsync(STREAM_RETRY_MS - 1);
  expect(tokens).toHaveBeenCalledTimes(1);
  await jest.advanceTimersByTimeAsync(1);
  expect(tokens).toHaveBeenCalledTimes(2);
  expect(last().url).toContain("token=t2.sig");

  // The new stream fails before any tick: the wait doubles.
  last().emit("error");
  await jest.advanceTimersByTimeAsync(STREAM_RETRY_MS * 2 - 1);
  expect(tokens).toHaveBeenCalledTimes(2);
  await jest.advanceTimersByTimeAsync(1);
  expect(tokens).toHaveBeenCalledTimes(3);

  // A tick resets the wait to the base.
  last().emit("tick", tick());
  expect(log.conn.at(-1)).toBe("open");
  last().emit("error");
  await jest.advanceTimersByTimeAsync(STREAM_RETRY_MS);
  expect(tokens).toHaveBeenCalledTimes(4);
  stream.stop();
});

test("a failed token shows the reason, retries after 5 seconds and clears the reason on success", async () => {
  let attempts = 0;
  const { stream, log, tokens } = setup(async () => {
    attempts += 1;
    if (attempts < 3) throw new Error("Could not get a live feed token.");
    return { url: "https://relay.test", token: `t${attempts}.sig` };
  });
  stream.start();
  await flush();
  expect(log.errors).toEqual(["Could not get a live feed token."]);
  expect(log.conn.at(-1)).toBe("connecting");
  expect(FakeSource.all).toHaveLength(0);

  await jest.advanceTimersByTimeAsync(TOKEN_RETRY_MS);
  expect(tokens).toHaveBeenCalledTimes(2);
  expect(log.errors).toHaveLength(2);

  await jest.advanceTimersByTimeAsync(TOKEN_RETRY_MS * 2);
  expect(tokens).toHaveBeenCalledTimes(3);
  expect(log.errors.at(-1)).toBeNull();
  expect(last().url).toContain("token=t3.sig");
  stream.stop();
});

test("a token failure after the stream worked reads as reconnecting", async () => {
  let attempts = 0;
  const { stream, log } = setup(async () => {
    attempts += 1;
    if (attempts === 2) throw new Error("Token error");
    return { url: "https://relay.test", token: `t${attempts}.sig` };
  });
  stream.start();
  await flush();
  last().emit("tick", tick());
  last().emit("error");
  await jest.advanceTimersByTimeAsync(STREAM_RETRY_MS);
  expect(log.errors.at(-1)).toBe("Token error");
  expect(log.conn.at(-1)).toBe("reconnecting");
  stream.stop();
});

test("a stream that goes quiet is replaced", async () => {
  const { stream, tokens, log } = setup();
  stream.start();
  await flush();
  last().emit("tick", tick());
  const quiet = last();
  await jest.advanceTimersByTimeAsync(WATCHDOG_MS - 1);
  expect(quiet.closed).toBe(false);
  await jest.advanceTimersByTimeAsync(1);
  expect(quiet.closed).toBe(true);
  expect(log.conn.at(-1)).toBe("reconnecting");
  await jest.advanceTimersByTimeAsync(STREAM_RETRY_MS);
  expect(tokens).toHaveBeenCalledTimes(2);
  expect(FakeSource.all).toHaveLength(2);
  stream.stop();
});

test("ticks keep the watchdog from firing", async () => {
  const { stream, tokens } = setup();
  stream.start();
  await flush();
  for (let i = 0; i < 20; i += 1) {
    last().emit("tick", tick(i));
    await jest.advanceTimersByTimeAsync(1000);
  }
  expect(tokens).toHaveBeenCalledTimes(1);
  expect(last().closed).toBe(false);
  stream.stop();
});

test("a long stream is swapped for one with a fresh token, without showing reconnecting", async () => {
  const { stream, tokens, log } = setup();
  stream.start();
  await flush();
  const old = last();
  for (let elapsed = 0; elapsed < MAX_STREAM_MS; elapsed += 1000) {
    old.emit("tick", tick(elapsed));
    await jest.advanceTimersByTimeAsync(1000);
  }
  expect(tokens).toHaveBeenCalledTimes(2);
  expect(old.closed).toBe(true);
  expect(last()).not.toBe(old);
  expect(last().url).toContain("token=t2.sig");
  expect(log.conn).not.toContain("reconnecting");
  stream.stop();
});

test("stop closes the stream, cancels a retry and drops a token that arrives late", async () => {
  let release: (value: { url: string; token: string }) => void = () => {};
  const pending = new Promise<{ url: string; token: string }>((resolve) => (release = resolve));
  const { stream, tokens } = setup(() => pending);
  stream.start();
  stream.stop();
  release({ url: "https://relay.test", token: "late.sig" });
  await flush();
  expect(FakeSource.all).toHaveLength(0);

  const second = setup();
  second.stream.start();
  await flush();
  const source = last();
  source.emit("error");
  second.stream.stop();
  await jest.advanceTimersByTimeAsync(60_000);
  expect(second.tokens).toHaveBeenCalledTimes(1);
  expect(FakeSource.all).toHaveLength(1);
  expect(source.closed).toBe(true);
  expect(tokens).toHaveBeenCalledTimes(1);
});

test("ignores events from a stream it has already replaced", async () => {
  const { stream, log } = setup();
  stream.start();
  await flush();
  const old = last();
  void stream.reconnect();
  await flush();
  old.emit("tick", tick(99));
  expect(log.ticks).toHaveLength(0);
  last().emit("tick", tick(1));
  expect(log.ticks).toHaveLength(1);
  stream.stop();
});

test("reconnect fetches a new token at once and resolves on the first tick", async () => {
  const { stream, tokens, log } = setup();
  stream.start();
  await flush();
  last().emit("tick", tick());
  const before = last();

  let done = false;
  void stream.reconnect().then(() => (done = true));
  await flush();
  expect(tokens).toHaveBeenCalledTimes(2);
  expect(before.closed).toBe(true);
  expect(last().url).toContain("token=t2.sig");
  expect(log.conn.at(-1)).toBe("reconnecting");
  expect(done).toBe(false);
  last().emit("tick", tick(2));
  await flush();
  expect(done).toBe(true);
  expect(log.conn.at(-1)).toBe("open");
  stream.stop();
});

test("reconnect resolves after its timeout when no tick arrives", async () => {
  const { stream } = setup();
  stream.start();
  await flush();
  let done = false;
  void stream.reconnect().then(() => (done = true));
  await jest.advanceTimersByTimeAsync(REFRESH_TIMEOUT_MS - 1);
  expect(done).toBe(false);
  await jest.advanceTimersByTimeAsync(1);
  expect(done).toBe(true);
  stream.stop();
});

test("reconnect on a stopped stream starts it, as returning to the app does", async () => {
  const { stream, tokens } = setup();
  stream.start();
  await flush();
  last().emit("tick", tick());
  stream.stop();
  expect(stream.running).toBe(false);
  void stream.reconnect();
  await flush();
  expect(stream.running).toBe(true);
  expect(tokens).toHaveBeenCalledTimes(2);
  stream.stop();
});

test("a malformed event is ignored", async () => {
  const { stream, log } = setup();
  stream.start();
  await flush();
  last().emit("tick", "{not json");
  last().emit("tick", { nope: true });
  last().emit("universe", "{}");
  last().emit("tick");
  expect(log.ticks).toHaveLength(0);
  expect(log.universes).toHaveLength(0);
  expect(log.conn).toEqual(["connecting"]);
  stream.stop();
});
