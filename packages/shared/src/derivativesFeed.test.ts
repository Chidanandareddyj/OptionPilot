import assert from "node:assert/strict";
import test from "node:test";
import { NORMAL_OPEN } from "./market.ts";
import {
  BOARD_CALCULATORS,
  DEFAULT_BOARD_VIEW,
  boardCountText,
  connectionLabel,
  countStale,
  evaluateBoard,
  isMarketOpen,
  mergeTick,
  parseRupees,
  staleNote,
  type BoardFeed,
} from "./derivativesFeed.ts";
import type { Company, LiveRow } from "./derivativesBoard.ts";

const NOW = 10_000_000;
const companies: Company[] = [
  { k: "A", s: "AAA", n: "Aaa", e: "2026-10-27", l: 100, strikes: [80, 90, 100, 110, 120, 130] },
  { k: "B", s: "BBB", n: "Bbb", e: "2026-10-27", l: 50, strikes: [80, 90, 100, 110, 120, 130] },
];
const row = (k: string, ltt = NOW): LiveRow => ({
  k,
  sp: 100,
  w: [
    [90, 14, ltt, 1, ltt],
    [100, 7, ltt, 6, ltt],
    [110, 4, ltt, 12, ltt],
  ],
});
const tick = (rows: LiveRow[], status = NORMAL_OPEN, live = true) => ({ rows, live, status, now: NOW });

test("all twelve strategies have a calculator", () => {
  assert.equal(Object.keys(BOARD_CALCULATORS).length, 12);
  for (const calc of Object.values(BOARD_CALCULATORS)) assert.equal(typeof calc, "function");
});

test("mergeTick keeps rows a later tick leaves out and replaces the ones it carries", () => {
  const first = mergeTick(null, tick([row("A"), row("B")]));
  assert.equal(first.rows.size, 2);
  const changed = { ...row("A"), sp: 101 };
  const second = mergeTick(first, tick([changed], "CLOSED", false));
  assert.equal(second.rows.size, 2);
  assert.equal(second.rows.get("A")?.sp, 101);
  assert.equal(second.rows.get("B")?.sp, 100);
  assert.equal(second.status, "CLOSED");
  assert.equal(second.live, false);
  assert.notEqual(second.rows, first.rows, "the previous feed is not mutated");
  assert.equal(first.rows.get("A")?.sp, 100);
});

test("isMarketOpen is true only for NORMAL_OPEN", () => {
  assert.equal(isMarketOpen(null), false);
  assert.equal(isMarketOpen(mergeTick(null, tick([]))), true);
  assert.equal(isMarketOpen(mergeTick(null, tick([], "CLOSED"))), false);
});

test("evaluateBoard skips companies without prices and an unknown strategy", () => {
  const feed = mergeTick(null, tick([row("A")]));
  const { evaluations, unavailable } = evaluateBoard(companies, feed, "bull_call_spread");
  assert.deepEqual(evaluations.map((e) => e.k), ["A"]);
  assert.equal(unavailable, 0);
  assert.equal(evaluations[0].maxProfit, 1000);
  assert.deepEqual(evaluateBoard(companies, null, "bull_call_spread"), { evaluations: [], unavailable: 0 });
  assert.deepEqual(evaluateBoard(companies, feed, "nope"), { evaluations: [], unavailable: 0 });
});

test("evaluateBoard marks old legs stale only while the market is open", () => {
  const old = row("A", NOW - 16 * 60_000);
  const open = evaluateBoard(companies, mergeTick(null, tick([old])), "bull_call_spread");
  assert.equal(open.evaluations[0].stale, "90CE");
  const closed = evaluateBoard(companies, mergeTick(null, tick([old], "CLOSED", false)), "bull_call_spread");
  assert.equal(closed.evaluations[0].stale, null);
});

test("countStale counts stale rows even when they are hidden", () => {
  const feed = mergeTick(null, tick([row("A"), row("B", NOW - 16 * 60_000)]));
  const { evaluations } = evaluateBoard(companies, feed, "bull_call_spread");
  assert.equal(countStale(evaluations, DEFAULT_BOARD_VIEW), 1);
  assert.equal(countStale(evaluations, { ...DEFAULT_BOARD_VIEW, hideStale: false }), 1);
});

test("connectionLabel: reconnecting, connecting, syncing, then nothing", () => {
  const open: BoardFeed = mergeTick(null, tick([row("A")]));
  assert.equal(connectionLabel("reconnecting", open), "Reconnecting…");
  assert.equal(connectionLabel("connecting", null), "Connecting…");
  assert.equal(connectionLabel("open", { ...open, live: false }), "Syncing…");
  assert.equal(connectionLabel("open", open), null);
  assert.equal(connectionLabel("open", mergeTick(null, tick([], "CLOSED", false))), null);
});

test("count and stale wording", () => {
  assert.equal(boardCountText(79, 219, 0), "Showing 79 of 219 contracts");
  assert.equal(boardCountText(1, 3, 2), "Showing 1 of 3 contracts, 2 unavailable");
  assert.equal(staleNote(0, true), null);
  assert.equal(staleNote(140, true), "140 stale rows are hidden");
  assert.equal(staleNote(140, false), "140 stale rows shown faded");
});

test("parseRupees treats blanks and junk as no limit", () => {
  assert.equal(parseRupees(""), null);
  assert.equal(parseRupees("  "), null);
  assert.equal(parseRupees("abc"), null);
  assert.equal(parseRupees("5000"), 5000);
});
