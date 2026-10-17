// OptionPilot relay: holds the single Upstox market-data socket and fans live option
// prices out to dashboards over SSE.
//
// Env (relay/.env): UPSTOX_ANALYTICS_TOKEN, RELAY_SECRET (same value as the Next app),
//                   PORT (default 8787), ALLOWED_ORIGIN (default *)
// Run locally:      cd relay && npm install && npm run dev   (reads relay/.env)
// Run in prod:      npm start   (host supplies the env vars)
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { createFeed } from "./feed.mjs";
import { atmIndex, loadUniverse, windowStrikes } from "./universe.mjs";

const { UPSTOX_ANALYTICS_TOKEN, RELAY_SECRET, PORT = 8787, ALLOWED_ORIGIN = "*" } = process.env;
if (!UPSTOX_ANALYTICS_TOKEN || !RELAY_SECRET) throw new Error("UPSTOX_ANALYTICS_TOKEN and RELAY_SECRET are required");

const istDay = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

// ---- state -----------------------------------------------------------------------
let universe = new Map(); // underlying_key -> universe entry
let loadedDay = "";
const companies = new Map(); // underlying_key -> { u, atm, dirty }
const owner = new Map(); // instrument_key -> underlying_key
const ticks = new Map(); // instrument_key -> { ltp, ltt }
let live = false;
let status = "UNKNOWN";
let needSync = true;
const clients = new Set();

function adopt(next) {
  universe = next;
  loadedDay = istDay();
  companies.clear();
  owner.clear();
  for (const u of next.values()) {
    companies.set(u.key, { u, atm: -1, dirty: true });
    owner.set(u.key, u.key);
    for (const s of u.strikes) {
      owner.set(s.ce, u.key);
      owner.set(s.pe, u.key);
    }
  }
  needSync = true;
}

const window_ = (c) => (c.atm < 0 ? [] : windowStrikes(c.u.strikes, c.atm));

function desiredKeys() {
  const keys = new Set();
  for (const c of companies.values()) {
    keys.add(c.u.key);
    for (const s of window_(c)) keys.add(s.ce).add(s.pe);
  }
  return keys;
}

const feed = createFeed({
  token: UPSTOX_ANALYTICS_TOKEN,
  onConnection: (up) => {
    live = up;
    console.log(`[relay] upstox feed ${up ? "connected" : "disconnected"}`);
  },
  onMarketInfo: (seg) => (status = seg.NSE_FO ?? seg.NSE_EQ ?? status),
  onLtpc: (key, t) => {
    const prev = ticks.get(key);
    if (prev && prev.ltp === t.ltp && prev.ltt === t.ltt) return;
    ticks.set(key, t);
    const c = companies.get(owner.get(key));
    if (!c) return;
    c.dirty = true;
    if (key === c.u.key && t.ltp > 0) {
      const atm = atmIndex(c.u.strikes, t.ltp);
      if (atm !== c.atm) {
        c.atm = atm;
        needSync = true;
      }
    }
  },
});

// ---- wire format -----------------------------------------------------------------
const universeEvent = () =>
  [...universe.values()].map((u) => ({ k: u.key, s: u.symbol, n: u.name, e: u.expiry, l: u.lot, strikes: u.strikes.map((s) => s.strike) }));

function row(c) {
  const spot = ticks.get(c.u.key);
  if (!spot || spot.ltp <= 0) return null;
  const leg = (k) => ticks.get(k) ?? { ltp: 0, ltt: 0 };
  return {
    k: c.u.key,
    sp: spot.ltp,
    w: window_(c).map((s) => [s.strike, leg(s.ce).ltp, leg(s.ce).ltt, leg(s.pe).ltp, leg(s.pe).ltt]),
  };
}

const sse = (event, data) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
const tickEvent = (all) =>
  sse("tick", {
    live,
    status,
    now: Date.now(),
    rows: [...companies.values()].filter((c) => all || c.dirty).map(row).filter(Boolean),
  });

// ---- flush loop: sync subscriptions, then push changed rows once a second ----------
setInterval(() => {
  if (needSync) {
    needSync = false;
    feed.setDesired(desiredKeys());
  }
  if (clients.size) {
    const payload = tickEvent(false);
    for (const res of clients) res.write(payload);
  }
  for (const c of companies.values()) c.dirty = false;
}, 1000);

setInterval(() => clients.forEach((res) => res.write(": ping\n\n")), 15000);

// Reload contracts once the IST day changes (expiry rollover, new strikes).
setInterval(async () => {
  if (istDay() === loadedDay) return;
  try {
    adopt(await loadUniverse());
    const payload = sse("universe", universeEvent());
    for (const res of clients) res.write(payload);
    console.log(`[relay] universe reloaded: ${universe.size} underlyings`);
  } catch (err) {
    console.error("[relay] universe reload failed:", err.message);
  }
}, 10 * 60 * 1000);

// ---- http ------------------------------------------------------------------------
// Token is "<expiryMs>.<hex hmac-sha256(expiryMs)>", minted by the Next app (/api/derivatives/token).
function validToken(token = "") {
  const [exp, sig = ""] = token.split(".");
  if (!(Number(exp) > Date.now())) return false;
  const want = createHmac("sha256", RELAY_SECRET).update(exp).digest("hex");
  return sig.length === want.length && timingSafeEqual(Buffer.from(sig), Buffer.from(want));
}

createServer((req, res) => {
  const url = new URL(req.url, "http://relay");
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  if (url.pathname === "/health") return void res.end(JSON.stringify({ live, status, underlyings: universe.size, clients: clients.size }));
  if (url.pathname !== "/stream") return void res.writeHead(404).end();
  if (!validToken(url.searchParams.get("token") ?? "")) return void res.writeHead(401).end();

  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
  res.write(sse("universe", universeEvent()));
  res.write(tickEvent(true));
  clients.add(res);
  req.on("close", () => clients.delete(res));
}).listen(PORT, () => console.log(`[relay] listening on :${PORT}`));

adopt(await loadUniverse());
console.log(`[relay] universe loaded: ${universe.size} underlyings`);
