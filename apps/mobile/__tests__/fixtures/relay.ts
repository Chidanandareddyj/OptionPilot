import type { Company, LiveRow, RelayTick } from "@optionpilot/shared";
import type { StreamSource } from "@/lib/derivatives/stream";

type Listener = (event: { data?: string | null; type?: string }) => void;

/** An EventSource double: tests push events into it as the relay would. */
export class FakeSource implements StreamSource {
  static all: FakeSource[] = [];
  static get latest() {
    return FakeSource.all[FakeSource.all.length - 1];
  }
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

/** A Friday at 15:30 IST and a Monday at 14:46 IST, in the relay's millisecond clock. */
export const FRIDAY_CLOSE = Date.UTC(2026, 9, 23, 10, 0);
export const MONDAY_AFTERNOON = Date.UTC(2026, 9, 26, 9, 16);

const SYMBOLS = ["ABB", "ADANIENT", "ADANIGREEN", "ALKEM", "AMBUJACEM", "ASHOKLEY"];

/** Six companies, each with strikes ten apart around its spot. */
export const UNIVERSE: Company[] = SYMBOLS.map((symbol, i) => {
  const spot = 100 + i * 40;
  return {
    k: `NSE_EQ|${symbol}`,
    s: symbol,
    n: symbol,
    e: "2026-10-27",
    l: 100 + i * 25,
    strikes: Array.from({ length: 9 }, (_, n) => spot - 40 + n * 10),
  };
});

/** Intrinsic value, a little time value that fades away from the money, and a tilt per company so no two rank alike. */
const priceOf = (spot: number, strike: number, side: "CE" | "PE", tilt: number) =>
  Math.round((Math.max(side === "CE" ? spot - strike : strike - spot, 0) + 8 - Math.abs(strike - spot) * 0.05 - (side === "CE" ? 1 : -1) * (strike - spot) * 0.02 * tilt) * 20) / 20;

/** The live slice for one company. `ltt` is when its legs last traded. */
export function liveRow(company: Company, ltt: number, skew = 0): LiveRow {
  const spot = company.strikes[4];
  const tilt = UNIVERSE.findIndex((c) => c.k === company.k) + 1;
  return {
    k: company.k,
    sp: spot + skew,
    w: company.strikes.map((strike) => [strike, priceOf(spot, strike, "CE", tilt), ltt, priceOf(spot, strike, "PE", tilt), ltt]),
  };
}

export const tickOf = (rows: LiveRow[], now: number, status = "NORMAL_OPEN", live = true): RelayTick => ({ rows, live, status, now });

/** Every company priced and fresh, as the relay's first tick would send it. */
export const fullTick = (now = MONDAY_AFTERNOON, status = "NORMAL_OPEN") =>
  tickOf(UNIVERSE.map((company) => liveRow(company, now)), now, status, status === "NORMAL_OPEN");
