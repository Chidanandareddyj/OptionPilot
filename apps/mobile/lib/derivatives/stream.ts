import type { Company, ConnState, RelayTick, RelayTokenResponse } from "@optionpilot/shared";

/** What the stream needs from an EventSource, which `react-native-sse` and a test double both have. */
export type StreamSource = {
  addEventListener: (type: string, listener: (event: { data?: string | null; type?: string; message?: string }) => void) => void;
  close: () => void;
};

export type StreamDeps = {
  fetchToken: () => Promise<RelayTokenResponse>;
  createSource: (url: string) => StreamSource;
};

export type StreamHandlers = {
  onUniverse: (companies: Company[]) => void;
  onTick: (tick: RelayTick) => void;
  onConn: (conn: ConnState) => void;
  /** The reason the live feed is unavailable, or null once a token was issued again. */
  onError: (message: string | null) => void;
};

export const STREAM_RETRY_MS = 3_000;
export const TOKEN_RETRY_MS = 5_000;
export const MAX_BACKOFF_MS = 30_000;
/** The relay ticks every second even when nothing changed, so this much quiet means the link is dead. */
export const WATCHDOG_MS = 15_000;
/**
 * `react-native-sse` keeps the whole response in memory, so a long stream grows without bound.
 * A stream is replaced with a fresh token before it gets large.
 */
export const MAX_STREAM_MS = 5 * 60_000;
/** How long a pull to refresh waits for the first tick before giving up. */
export const REFRESH_TIMEOUT_MS = 10_000;

/** Waiting time after the nth failure in a row: the base, doubling, up to half a minute. */
export const backoffMs = (base: number, attempt: number) => Math.min(base * 2 ** attempt, MAX_BACKOFF_MS);

/**
 * The relay connection, with no React in it. Every connection asks for a new token, because a token
 * only lives for 60 seconds. A failed token or a dropped stream retries with a growing delay; a tick
 * resets the delay. A silent stream is replaced, and so is one that has run too long.
 */
export class RelayStream {
  private active = false;
  /** Counts connection attempts, so a token that arrives late for a replaced attempt is dropped. */
  private attemptId = 0;
  /** Counts opened streams, so a closed stream's late events are ignored. */
  private generation = 0;
  private source: StreamSource | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private watchdog: ReturnType<typeof setTimeout> | undefined;
  private lifetime: ReturnType<typeof setTimeout> | undefined;
  private attempt = 0;
  private everOpen = false;
  private waiters: (() => void)[] = [];

  constructor(
    private readonly deps: StreamDeps,
    private readonly handlers: StreamHandlers,
  ) {}

  get running() {
    return this.active;
  }

  /** Connects, unless it already is. */
  start() {
    if (this.active) return;
    this.active = true;
    this.attempt = 0;
    void this.connect(false);
  }

  /** Closes the stream and cancels any retry. The data already received is the caller's to keep. */
  stop() {
    this.active = false;
    this.attemptId += 1;
    this.generation += 1;
    this.teardown();
    this.settle();
  }

  /**
   * Drops the connection and opens a new one with a fresh token now. Resolves once the first tick
   * arrives, or when it fails, or after a timeout, so a pull to refresh knows when to stop spinning.
   */
  reconnect(): Promise<void> {
    const done = new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, REFRESH_TIMEOUT_MS);
      this.waiters.push(() => {
        clearTimeout(timer);
        resolve();
      });
    });
    this.active = true;
    this.attempt = 0;
    void this.connect(true);
    return done;
  }

  private settle() {
    const waiters = this.waiters;
    this.waiters = [];
    waiters.forEach((resolve) => resolve());
  }

  private teardown() {
    clearTimeout(this.retryTimer);
    clearTimeout(this.watchdog);
    clearTimeout(this.lifetime);
    this.source?.close();
    this.source = null;
  }

  /** `visible` false keeps the connection state as it is, for swapping a long stream without a "Reconnecting" flash. */
  private async connect(visible: boolean) {
    this.attemptId += 1;
    const id = this.attemptId;
    clearTimeout(this.retryTimer);
    if (visible || !this.source) this.handlers.onConn(this.everOpen ? "reconnecting" : "connecting");

    let token: RelayTokenResponse;
    try {
      token = await this.deps.fetchToken();
    } catch (error) {
      if (id !== this.attemptId || !this.active) return;
      this.handlers.onError(error instanceof Error ? error.message : String(error));
      this.handlers.onConn(this.everOpen ? "reconnecting" : "connecting");
      this.settle();
      this.retryAfter(TOKEN_RETRY_MS);
      return;
    }
    if (id !== this.attemptId || !this.active) return;

    this.handlers.onError(null);
    this.teardown();
    this.generation += 1;
    const mine = this.generation;
    const url = `${token.url.replace(/\/+$/, "")}/stream?token=${encodeURIComponent(token.token)}`;
    const source = this.deps.createSource(url);
    this.source = source;
    source.addEventListener("universe", (event) => {
      if (mine !== this.generation) return;
      const companies = parse<Company[]>(event.data);
      if (Array.isArray(companies)) this.handlers.onUniverse(companies);
    });
    source.addEventListener("tick", (event) => {
      if (mine !== this.generation) return;
      const tick = parse<RelayTick>(event.data);
      if (!tick || !Array.isArray(tick.rows)) return;
      this.everOpen = true;
      this.attempt = 0;
      this.armWatchdog(mine);
      this.handlers.onConn("open");
      this.handlers.onTick(tick);
      this.settle();
    });
    source.addEventListener("error", () => {
      if (mine !== this.generation || !this.active) return;
      this.dropped(mine);
    });
    this.armWatchdog(mine);
    this.lifetime = setTimeout(() => {
      if (mine === this.generation && this.active) void this.connect(false);
    }, MAX_STREAM_MS);
  }

  private armWatchdog(mine: number) {
    clearTimeout(this.watchdog);
    this.watchdog = setTimeout(() => {
      if (mine === this.generation && this.active) this.dropped(mine);
    }, WATCHDOG_MS);
  }

  private dropped(mine: number) {
    if (mine !== this.generation) return;
    this.generation += 1;
    this.teardown();
    this.handlers.onConn(this.everOpen ? "reconnecting" : "connecting");
    this.settle();
    this.retryAfter(STREAM_RETRY_MS);
  }

  private retryAfter(base: number) {
    const wait = backoffMs(base, this.attempt);
    this.attempt += 1;
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      if (this.active) void this.connect(true);
    }, wait);
  }
}

function parse<T>(data: string | null | undefined): T | null {
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}
