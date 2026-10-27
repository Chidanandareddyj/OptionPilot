import type { AnalysisSummary, MarketIndicesResponse } from "@optionpilot/shared";
import { formatIstClock, marketStatus } from "@/lib/market/status";
import { buildRecentRows, recentStockSymbols } from "@/lib/market/recent";

const summary = (company: string): AnalysisSummary => ({
  id: company,
  company,
  spot: 100,
  tag: "12 strategies",
  createdAt: "2026-10-23T16:57:00.000Z",
});

const indices: MarketIndicesResponse = {
  isLive: true,
  status: "OPEN",
  timestamp: "2026-10-26T09:16:00.000Z",
  source: "live",
  indices: {
    nifty: { symbol: "NIFTY 50", price: 22690.9, netChange: -47.8, percentChange: -0.21, close: 22738.7 },
    bankNifty: { symbol: "NIFTY BANK", price: 54287.35, netChange: -620, percentChange: -1.13, close: 54907.35 },
  },
};

describe("market status pill", () => {
  it("reads the wall clock in IST", () => {
    expect(formatIstClock(new Date("2026-10-26T09:16:00.000Z"))).toBe("14:46");
    expect(formatIstClock(new Date("2026-10-26T18:30:00.000Z"))).toBe("00:00");
  });

  it("is offline before anything else", () => {
    expect(marketStatus({ online: false, isLive: true })).toEqual({ kind: "offline", label: "Offline" });
  });

  it("is blank until the first response", () => {
    expect(marketStatus({ online: true })).toBeNull();
  });

  it("says open with the quote time, or closed", () => {
    expect(marketStatus({ online: true, isLive: true, timestamp: "2026-10-26T09:16:00.000Z" })).toEqual({
      kind: "open",
      label: "NSE open",
      clock: "14:46",
    });
    expect(marketStatus({ online: true, isLive: false })).toEqual({ kind: "closed", label: "NSE closed" });
  });
});

describe("recent symbols", () => {
  it("lists analysed stocks first, newest first, without duplicates or indices", () => {
    const history = [summary("tcs"), summary("NIFTY"), summary("TCS"), summary("SBIN")];
    expect(recentStockSymbols(history)).toEqual(["TCS", "SBIN", "RELIANCE"]);
  });

  it("falls back to the quick symbols when there is no history", () => {
    expect(recentStockSymbols([])).toEqual(["RELIANCE", "TCS", "INFY"]);
  });

  it("puts the indices first and fills prices from the quotes", () => {
    const rows = buildRecentRows(
      indices,
      [{ symbol: "TCS", price: 3842.1, netChange: 24.5, percentChange: 0.64, close: 3817.6 }],
      ["TCS", "INFY"],
    );
    expect(rows).toEqual([
      { symbol: "NIFTY", price: 22690.9, percentChange: -0.21 },
      { symbol: "BANKNIFTY", price: 54287.35, percentChange: -1.13 },
      { symbol: "TCS", price: 3842.1, percentChange: 0.64 },
      { symbol: "INFY", price: null, percentChange: null },
    ]);
  });

  it("keeps the rows with empty prices before anything loads", () => {
    expect(buildRecentRows(undefined, undefined, ["TCS"]).map((r) => r.price)).toEqual([null, null, null]);
  });
});
