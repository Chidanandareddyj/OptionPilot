import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import protobuf from "protobufjs";
import WebSocket from "ws";

const AUTHORIZE_URL = "https://api.upstox.com/v3/feed/market-data-feed/authorize";
const CHUNK = 500;

const FeedResponse = protobuf
  .loadSync(fileURLToPath(new URL("./MarketDataFeedV3.proto", import.meta.url)))
  .lookupType("com.upstox.marketdatafeederv3udapi.rpc.proto.FeedResponse");

/** Pull the LTPC block out of whichever feed variant arrived. */
const ltpcOf = (f) =>
  f.ltpc ?? f.fullFeed?.marketFF?.ltpc ?? f.fullFeed?.indexFF?.ltpc ?? f.firstLevelWithGreeks?.ltpc;

/**
 * One Upstox market-data socket in `ltpc` mode. Call setDesired(Set<instrumentKey>);
 * the feed diffs it against what is subscribed and sends sub/unsub. Reconnects itself
 * (a fresh authorize URL each time, since the URL is single-use) and resubscribes.
 */
export function createFeed({ token, onLtpc, onMarketInfo, onConnection }) {
  let ws = null;
  let desired = new Set();
  const subscribed = new Set();
  let backoff = 1000;

  const send = (method, keys) => {
    for (let i = 0; i < keys.length; i += CHUNK) {
      const msg = { guid: randomUUID().slice(0, 20), method, data: { mode: "ltpc", instrumentKeys: keys.slice(i, i + CHUNK) } };
      ws.send(Buffer.from(JSON.stringify(msg))); // Upstox requires a binary frame
    }
  };

  function sync() {
    if (ws?.readyState !== WebSocket.OPEN) return;
    const remove = [...subscribed].filter((k) => !desired.has(k));
    const add = [...desired].filter((k) => !subscribed.has(k));
    if (remove.length) send("unsub", remove);
    if (add.length) send("sub", add);
    remove.forEach((k) => subscribed.delete(k));
    add.forEach((k) => subscribed.add(k));
  }

  function retry() {
    setTimeout(connect, backoff);
    backoff = Math.min(backoff * 2, 30000);
  }

  async function connect() {
    try {
      const res = await fetch(AUTHORIZE_URL, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
      if (!res.ok) throw new Error(`authorize failed: ${res.status} ${await res.text()}`);
      ws = new WebSocket((await res.json()).data.authorized_redirect_uri);
    } catch (err) {
      console.error("[feed]", err.message);
      return retry();
    }

    ws.on("open", () => {
      backoff = 1000;
      subscribed.clear();
      onConnection(true);
      sync();
    });
    ws.on("message", (data) => {
      let msg;
      try {
        msg = FeedResponse.toObject(FeedResponse.decode(data), { longs: String, enums: String });
      } catch (err) {
        return console.error("[feed] bad frame:", err.message);
      }
      if (msg.marketInfo?.segmentStatus) onMarketInfo(msg.marketInfo.segmentStatus);
      for (const [key, feed] of Object.entries(msg.feeds ?? {})) {
        const l = ltpcOf(feed);
        if (l) onLtpc(key, { ltp: l.ltp ?? 0, ltt: Number(l.ltt ?? 0), cp: l.cp ?? 0 });
      }
    });
    ws.on("error", (err) => console.error("[feed]", err.message));
    ws.on("close", () => {
      onConnection(false);
      retry();
    });
  }

  connect();
  return {
    setDesired(keys) {
      desired = keys;
      sync();
    },
  };
}
