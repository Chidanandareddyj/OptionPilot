import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import EventSource from "react-native-sse";
import { mergeTick, type BoardFeed, type Company, type ConnState } from "@optionpilot/shared";
import { useApi } from "@/lib/api/hooks";
import { useOnline } from "@/lib/api/online";
import { RelayStream, type StreamSource } from "./stream";

/** How long the stream stays open after the last screen that wanted it has gone, so a sheet or a tab switch does not reconnect. */
export const RELEASE_GRACE_MS = 10_000;

type LiveFeed = {
  companies: Company[];
  feed: BoardFeed | null;
  conn: ConnState;
  /** Why the live feed is unavailable, while a token cannot be had. */
  error: string | null;
  /** Reconnects with a fresh token. Resolves when the first tick lands, or after a timeout. */
  refresh: () => Promise<void>;
  /** Asks for the stream while a screen shows prices. Returns the release. */
  acquire: () => () => void;
};

const Context = createContext<LiveFeed | null>(null);

type FeedProviderProps = {
  children: ReactNode;
  /** The EventSource to use. Tests pass a double; the app uses `react-native-sse`. */
  createSource?: (url: string) => StreamSource;
};

// `pollingInterval: 0` turns off the library's own reconnect, which would reuse an expired token.
const nativeSource = (url: string): StreamSource => new EventSource<"universe" | "tick">(url, { pollingInterval: 0 }) as unknown as StreamSource;

/**
 * Owns the one relay connection. It runs only while a screen asks for it, closes in the background,
 * and opens again with a new token when the app comes back or the network returns. What it has
 * received is kept while closed, so the board never goes blank on a short break.
 */
export function FeedProvider({ children, createSource = nativeSource }: FeedProviderProps) {
  const api = useApi();
  const online = useOnline();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [feed, setFeed] = useState<BoardFeed | null>(null);
  const [conn, setConn] = useState<ConnState>("connecting");
  const [error, setError] = useState<string | null>(null);

  const holds = useRef(0);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const appActive = useRef(AppState.currentState !== "background");
  const api_ = useRef(api);
  const createSource_ = useRef(createSource);
  useEffect(() => {
    api_.current = api;
    createSource_.current = createSource;
  }, [api, createSource]);

  const [stream] = useState(
    () =>
      new RelayStream(
        { fetchToken: () => api_.current.derivativesToken(), createSource: (url) => createSource_.current(url) },
        {
          onUniverse: setCompanies,
          onTick: (tick) => setFeed((previous) => mergeTick(previous, tick)),
          onConn: setConn,
          onError: setError,
        },
      ),
  );

  const acquire = useCallback(() => {
    holds.current += 1;
    clearTimeout(releaseTimer.current);
    if (appActive.current) stream.start();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      holds.current -= 1;
      if (holds.current > 0) return;
      clearTimeout(releaseTimer.current);
      releaseTimer.current = setTimeout(() => stream.stop(), RELEASE_GRACE_MS);
    };
  }, [stream]);

  const refresh = useCallback(() => stream.reconnect(), [stream]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "background") {
        appActive.current = false;
        stream.stop();
      } else if (status === "active") {
        appActive.current = true;
        // The socket may have died while suspended, so open a new one with a fresh token.
        if (holds.current > 0) void stream.reconnect();
      }
    });
    return () => subscription.remove();
  }, [stream]);

  // Back online: do not wait out the backoff.
  const wasOnline = useRef(online);
  useEffect(() => {
    if (online && !wasOnline.current && holds.current > 0 && appActive.current) void stream.reconnect();
    wasOnline.current = online;
  }, [online, stream]);

  useEffect(
    () => () => {
      clearTimeout(releaseTimer.current);
      stream.stop();
    },
    [stream],
  );

  const value = useMemo(
    () => ({ companies, feed, conn, error, refresh, acquire }),
    [companies, feed, conn, error, refresh, acquire],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** The live board data. `active` false leaves the stream to other screens: pass false while the screen is not showing. */
export function useLiveFeed(active = true): LiveFeed {
  const value = useContext(Context);
  if (!value) throw new Error("useLiveFeed needs a FeedProvider above it.");
  const { acquire } = value;
  useEffect(() => (active ? acquire() : undefined), [active, acquire]);
  return value;
}
