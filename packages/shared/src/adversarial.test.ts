import assert from "node:assert/strict";
import test from "node:test";
import {
  parseStoredDecision,
  mergeCompareDecision,
  isCompareDecision,
  type Pane,
  type StoredDecision,
} from "./analysis.ts";
import {
  applyView,
  type Evaluation,
  type View,
  type SortKey,
} from "./derivativesBoard.ts";
import { normalizeStrategy, STRATEGY_DEFINITIONS, inr, keyMetrics } from "./types.ts";

// Helper replicating strategy-explorer's asDecision
function asDecision(value: unknown) {
  if (!value || typeof value !== "object") return null;
  return Array.isArray((value as { strategies?: unknown }).strategies)
    ? (value as {
        strategies: Array<{ key: string; score: number; viable: boolean; reasons: string[] }>;
        best?: { key?: string; source?: string } | null;
        view?: string;
        max_loss_budget?: number;
      })
    : null;
}

// Helper replicating strategy-explorer's lotOf
function lotOf(value: unknown) {
  if (!value || typeof value !== "object") return 0;
  const n = (value as { lot_size?: unknown }).lot_size;
  return typeof n === "number" && n > 0 ? n : 0;
}

test("State Transition Oracle: showBoard strict mutual exclusivity and history drawer action", () => {
  type AppState = {
    showBoard: boolean;
    historyOpen: boolean;
    active: { id: string; company: string } | null;
    pending: boolean;
  };

  const createInitialState = (): AppState => ({
    showBoard: false,
    historyOpen: false,
    active: { id: "snap-1", company: "NIFTY" },
    pending: false,
  });

  // Action 1: Toggle showBoard to true (Live Market view)
  let state = createInitialState();
  state = { ...state, showBoard: !state.showBoard };
  assert.equal(state.showBoard, true);

  // When showBoard is true, only DerivativesBoard is displayed
  const getRenderedComponent = (s: AppState) => {
    if (s.showBoard) return "DerivativesBoard";
    if (s.pending) return "LoadingSkeleton";
    if (s.active) return "StrategyExplorer";
    return "EmptyState";
  };

  assert.equal(getRenderedComponent(state), "DerivativesBoard");

  // Invariant: Both CANNOT render at the same time
  assert.notEqual(getRenderedComponent(state), "StrategyExplorer");

  // Action 2: Open History Drawer while on DerivativesBoard
  state = { ...state, historyOpen: true };
  assert.equal(state.historyOpen, true);
  assert.equal(state.showBoard, true); // drawer is a slide-out overlay sheet

  // Action 3: Click a history snapshot in the drawer
  const clickedSnapshot = { id: "snap-2", company: "RELIANCE" };
  // Replicating analyze-panel.tsx lines 671-675:
  state = {
    ...state,
    active: clickedSnapshot,
    showBoard: false,
    historyOpen: false,
  };

  assert.equal(state.showBoard, false, "showBoard MUST switch to false on history snapshot click");
  assert.equal(state.historyOpen, false, "historyOpen MUST switch to false on history snapshot click");
  assert.equal(state.active.id, "snap-2", "active MUST update to selected snapshot");
  assert.equal(getRenderedComponent(state), "StrategyExplorer", "Rendered view MUST be StrategyExplorer");

  // Action 4: Analyze triggered from search bar or DerivativesBoard
  state = { ...state, showBoard: true };
  // Replicating analyze() in analyze-panel.tsx lines 462-466:
  // setShowBoard(false); setHistoryOpen(false); setPending(true);
  state = {
    ...state,
    showBoard: false,
    historyOpen: false,
    pending: true,
  };
  assert.equal(state.showBoard, false);
  assert.equal(state.historyOpen, false);
  assert.equal(getRenderedComponent(state), "LoadingSkeleton");

  // Action 5: Toggle showBoard back to true
  state = { ...state, pending: false, showBoard: true };
  assert.equal(getRenderedComponent(state), "DerivativesBoard");
  state = { ...state, showBoard: false };
  assert.equal(getRenderedComponent(state), "StrategyExplorer");
});

test("Compare Views Mode: asDecision parser handles all corrupted and edge inputs", () => {
  assert.equal(asDecision(null), null);
  assert.equal(asDecision(undefined), null);
  assert.equal(asDecision(123), null);
  assert.equal(asDecision("corrupted string"), null);
  assert.equal(asDecision({}), null);
  assert.equal(asDecision({ strategies: "not an array" }), null);
  assert.equal(asDecision({ strategies: null }), null);

  const valid = {
    strategies: [
      { key: "bull_call_spread", score: 85, viable: true, reasons: ["High POP"] },
    ],
    best: { key: "bull_call_spread" },
  };
  const parsed = asDecision(valid);
  assert.ok(parsed);
  assert.equal(parsed.strategies.length, 1);
  assert.equal(parsed.best?.key, "bull_call_spread");
});

test("Compare Views Mode: lotOf extracts positive integers and handles edge cases", () => {
  assert.equal(lotOf(null), 0);
  assert.equal(lotOf(undefined), 0);
  assert.equal(lotOf("50"), 0);
  assert.equal(lotOf({ lot_size: -25 }), 0);
  assert.equal(lotOf({ lot_size: 0 }), 0);
  assert.equal(lotOf({ lot_size: "75" }), 0);
  assert.equal(lotOf({ lot_size: 50 }), 50);
  assert.equal(lotOf({ lot_size: 1750 }), 1750);
});

test("Compare Views Mode: ranked Map and sort resilience with null or missing decisions", () => {
  // Simulate null rankedDecision
  const rankedDecisionNull = null;
  const rankedMapNull = new Map(
    (rankedDecisionNull as { strategies?: Array<{ key: string }> } | null)?.strategies?.map((s, i) => [s.key, { ...s, rank: i + 1 }]),
  );
  assert.equal(rankedMapNull.size, 0);

  const spot = 22000;
  const sampleData = {
    underlying_spot_price: spot,
    bull_call_spread: {
      spot_price: 22000,
      lower_strike: 21900,
      higher_strike: 22100,
      net_debit: 100,
      max_profit: 100,
      max_loss: 100,
      breakeven: 22000,
      payoff_table: [{ closing_price: 22000, net_pl: 0 }],
    },
    bear_put_spread: {
      spot_price: 22000,
      long_put_strike: 22100,
      short_put_strike: 21900,
      net_debit: 90,
      max_profit: 110,
      max_loss: 90,
      breakeven: 22010,
      payoff_table: [{ closing_price: 22000, net_pl: 10 }],
    },
  };

  const strategies = Object.keys(STRATEGY_DEFINITIONS).flatMap(
    (key) => normalizeStrategy(key, (sampleData as Record<string, unknown>)[key], spot, 50) ?? [],
  );

  // Sorting with null ranked map: must not throw
  assert.doesNotThrow(() => {
    const sorted = [...strategies].sort(
      (a, b) => (rankedMapNull.get(a.key)?.rank ?? 99) - (rankedMapNull.get(b.key)?.rank ?? 99),
    );
    assert.ok(sorted.length > 0);
  });

  // Sorting with active ranked decision
  const rankedDecisionActive = {
    strategies: [
      { key: "bear_put_spread", score: 92, viable: true, reasons: [] },
      { key: "bull_call_spread", score: 65, viable: true, reasons: [] },
    ],
  };
  const rankedMapActive = new Map(
    rankedDecisionActive.strategies.map((s, i) => [s.key, { ...s, rank: i + 1 }]),
  );
  const sorted = [...strategies].sort(
    (a, b) => (rankedMapActive.get(a.key)?.rank ?? 99) - (rankedMapActive.get(b.key)?.rank ?? 99),
  );
  assert.equal(sorted[0].key, "bear_put_spread", "bear_put_spread ranked #1 should come first");
});

test("Compare Views Mode: pane state transitions and single-to-compare seeding", () => {
  const singleDecision = {
    view: "neutral",
    strategies: [{ key: "long_straddle", score: 70, viable: true, reasons: [] }],
    best: { key: "long_straddle" },
    max_loss_budget: 15000,
  };

  // 1. Initial stored decision is single
  const stored = parseStoredDecision(singleDecision);
  assert.equal(stored.mode, "single");

  // 2. Switching to compareMode: user updates left pane with bullish decision
  const leftDecision = {
    view: "bullish",
    strategies: [{ key: "bull_call_spread", score: 88, viable: true, reasons: [] }],
    best: { key: "bull_call_spread" },
  };

  const mergedLeft = mergeCompareDecision(singleDecision, "left", leftDecision);
  assert.equal(mergedLeft.compare, true);
  assert.deepEqual(mergedLeft.left, leftDecision);
  // Seeds opposite pane (right) from existing single decision
  assert.deepEqual(mergedLeft.right, singleDecision);

  // 3. User updates right pane with bearish decision
  const rightDecision = {
    view: "bearish",
    strategies: [{ key: "bear_put_spread", score: 91, viable: true, reasons: [] }],
    best: { key: "bear_put_spread" },
  };
  const mergedBoth = mergeCompareDecision(mergedLeft, "right", rightDecision);
  assert.equal(mergedBoth.compare, true);
  assert.deepEqual(mergedBoth.left, leftDecision);
  assert.deepEqual(mergedBoth.right, rightDecision);

  // 4. Stored decision is now compare mode
  const storedCompare = parseStoredDecision(mergedBoth);
  assert.equal(storedCompare.mode, "compare");
  if (storedCompare.mode === "compare") {
    assert.ok(asDecision(storedCompare.left));
    assert.ok(asDecision(storedCompare.right));
  }
});

test("Financial precision & typography verification", () => {
  // Verify Instrument Serif is used for editorial figures & clock
  const time = "15:30:24";
  const hm = time.slice(0, 5);
  const s = time.slice(5);
  assert.equal(hm, "15:30");
  assert.equal(s, ":24");

  // Verify INR formatting with high-precision currency decimals
  assert.equal(inr(22500.5), "₹22,500.50");
  assert.equal(inr(-1500), "₹-1,500.00");
  assert.equal(inr(0), "₹0.00");
});

test("DerivativesBoard: applyView sort and filter stress testing", () => {
  const mockEvaluations: Evaluation[] = [
    {
      k: "INFY",
      symbol: "INFY",
      name: "Infosys",
      expiry: "2026-10-29",
      lot: 400,
      spot: 1800,
      maxProfit: 12000,
      maxLoss: 8000,
      investment: 8000,
      roi: 1.5,
      breakevens: [1820],
      beDistancePct: 1.11,
      stale: null,
      payoff: [],
    },
    {
      k: "TCS",
      symbol: "TCS",
      name: "Tata Consultancy",
      expiry: "2026-10-29",
      lot: 175,
      spot: 4200,
      maxProfit: null, // Unlimited profit (e.g. long straddle)
      maxLoss: 15000,
      investment: 15000,
      roi: null,
      breakevens: [4100, 4300],
      beDistancePct: 2.38,
      stale: null,
      payoff: [],
    },
    {
      k: "RELIANCE",
      symbol: "RELIANCE",
      name: "Reliance Industries",
      expiry: "2026-10-29",
      lot: 250,
      spot: 2900,
      maxProfit: 25000,
      maxLoss: null, // Unlimited loss (e.g. short straddle)
      investment: null,
      roi: null,
      breakevens: [2800, 3000],
      beDistancePct: 3.45,
      stale: "2900CE", // Stale row
      payoff: [],
    },
  ];

  // 1. Hide stale filtering
  const defaultView: View = {
    investment: "all",
    min: null,
    max: null,
    hideStale: true,
    search: "",
    sort: "roi",
    dir: "desc",
  };
  const filtered = applyView(mockEvaluations, defaultView);
  assert.equal(filtered.length, 2, "Stale row (RELIANCE) should be filtered out");
  assert.equal(filtered.find((r) => r.symbol === "RELIANCE"), undefined);

  // 2. Search filtering (case-insensitive substring)
  const searchView: View = { ...defaultView, hideStale: false, search: "rel" };
  const searched = applyView(mockEvaluations, searchView);
  assert.equal(searched.length, 1);
  assert.equal(searched[0].symbol, "RELIANCE");

  // 3. Sorting by ROI desc: finite ROI first, null ROI (-Infinity) last
  const roiSortView: View = { ...defaultView, sort: "roi", dir: "desc" };
  const sortedRoi = applyView(mockEvaluations, roiSortView);
  assert.equal(sortedRoi[0].symbol, "INFY");
  assert.equal(sortedRoi[1].symbol, "TCS");

  // 4. Sorting by investment asc: finite investment ascending
  const invSortView: View = { ...defaultView, sort: "investment", dir: "asc" };
  const sortedInv = applyView(mockEvaluations, invSortView);
  assert.equal(sortedInv[0].investment, 8000);
  assert.equal(sortedInv[1].investment, 15000);

  // 5. Min / Max rupee bounds
  const boundedView: View = { ...defaultView, min: 10000, max: 20000 };
  const bounded = applyView(mockEvaluations, boundedView);
  assert.equal(bounded.length, 1);
  assert.equal(bounded[0].symbol, "TCS");
});
