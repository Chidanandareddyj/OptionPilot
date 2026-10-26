import { parseStoredDecision, type Pane } from "./analysis";
import type { Decision } from "./contracts";
import type { Category, NormalizedStrategy } from "./types";

/** The filter chips above the strategy list. */
export type CompareFilter = Category | "all";

export const COMPARE_FILTERS: { id: CompareFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "bullish", label: "Bullish" },
  { id: "bearish", label: "Bearish" },
  { id: "neutral", label: "Neutral" },
  { id: "volatile", label: "Volatile" },
];

/** A stored recommendation, or null when the value is not one. */
export function asDecision(value: unknown): Decision | null {
  if (!value || typeof value !== "object") return null;
  return Array.isArray((value as Decision).strategies) ? (value as Decision) : null;
}

/** How many strategies each chip would show, for the counts beside the chip labels. */
export function filterCount(strategies: NormalizedStrategy[], filter: CompareFilter): number {
  return filter === "all" ? strategies.length : strategies.filter((s) => s.category === filter).length;
}

/**
 * The strategies the list shows, in the order the website shows them: the recommendation's ranking
 * when there is one (strategies it did not rank go last), else the catalogue order.
 */
export function visibleStrategies(
  strategies: NormalizedStrategy[],
  decision: Decision | null,
  filter: CompareFilter,
  query: string,
): NormalizedStrategy[] {
  const rank = new Map(decision?.strategies.map((s, i) => [s.key, i + 1]));
  return strategies
    .filter(
      (s) =>
        (filter === "all" || s.category === filter) &&
        `${s.name} ${s.tagline}`.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => (rank.get(a.key) ?? 99) - (rank.get(b.key) ?? 99));
}

export type CompareState = {
  compareMode: boolean;
  single: Decision | null;
  left: Decision | null;
  right: Decision | null;
  /** The strategy each pane opens on: its recommendation's pick, if it has one. */
  selected: Record<Pane, string | null>;
};

/**
 * What the website opens an analysis with. A saved single recommendation also fills the left pane,
 * so switching on "Compare views" starts from it.
 */
export function initialCompareState(savedDecision: unknown): CompareState {
  const stored = parseStoredDecision(savedDecision);
  const compareMode = stored.mode === "compare";
  const single = stored.mode === "single" ? asDecision(stored.single) : null;
  const left = stored.mode === "compare" ? asDecision(stored.left) : single;
  const right = stored.mode === "compare" ? asDecision(stored.right) : null;
  return {
    compareMode,
    single,
    left,
    right,
    selected: { left: left?.best?.key ?? null, right: right?.best?.key ?? null },
  };
}

/** The strategy shown in each pane: the selected one, else the first (left) and second (right). */
export function paneStrategies(
  strategies: NormalizedStrategy[],
  selected: Record<Pane, string | null>,
): Record<Pane, NormalizedStrategy | null> {
  const pick = (key: string | null) => strategies.find((s) => s.key === key) ?? null;
  return {
    left: pick(selected.left) ?? (strategies.length > 0 ? strategies[0] : null),
    right: pick(selected.right) ?? (strategies.length > 1 ? strategies[1] : (strategies[0] ?? null)),
  };
}
