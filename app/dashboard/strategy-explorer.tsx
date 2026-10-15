"use client";

import { useRef, useState } from "react";
import { parseStoredDecision, type Pane } from "@/lib/analysis";
import RecommendationPanel, { type Decision } from "./recommendation-panel";
import StrategyCard from "./strategy-card";
import StrategyDetail from "./strategy-detail";
import { normalizeStrategy, STRATEGY_DEFINITIONS, type Category } from "./types";

const FILTERS: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "bullish", label: "Bullish" },
  { id: "bearish", label: "Bearish" },
  { id: "neutral", label: "Neutral" },
  { id: "volatile", label: "Volatile" },
];

type Payload = {
  underlying_key?: string;
  expiry_date?: string;
  underlying_spot_price?: number;
  [key: string]: unknown;
};

function asDecision(value: unknown): Decision | null {
  if (!value || typeof value !== "object") return null;
  return Array.isArray((value as Decision).strategies) ? (value as Decision) : null;
}

function lotOf(value: unknown) {
  if (!value || typeof value !== "object") return 0;
  const n = (value as { lot_size?: unknown }).lot_size;
  return typeof n === "number" && n > 0 ? n : 0;
}

export default function StrategyExplorer({
  data: result,
  company,
  analysisId,
  decision: savedDecision,
}: {
  data: unknown;
  company: string;
  analysisId?: string;
  decision?: unknown;
}) {
  const data = (result ?? {}) as Payload;
  const stored = parseStoredDecision(savedDecision);
  const [compareMode, setCompareMode] = useState(stored.mode === "compare");
  const [single, setSingle] = useState<Decision | null>(stored.mode === "single" ? asDecision(stored.single) : null);
  const [left, setLeft] = useState<Decision | null>(stored.mode === "compare" ? asDecision(stored.left) : null);
  const [right, setRight] = useState<Decision | null>(stored.mode === "compare" ? asDecision(stored.right) : null);
  const [focusPane, setFocusPane] = useState<Pane>("left");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedByPane, setSelectedByPane] = useState<{ left: string | null; right: string | null }>({
    left: stored.mode === "compare" ? (asDecision(stored.left)?.best?.key ?? null) : null,
    right: stored.mode === "compare" ? (asDecision(stored.right)?.best?.key ?? null) : null,
  });
  const [filter, setFilter] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [showJson, setShowJson] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const rankedDecision = compareMode ? (focusPane === "left" ? left : right) : single;
  const spot = data.underlying_spot_price ?? 0;
  const lotSize = lotOf(data) || lotOf(rankedDecision) || lotOf(single) || lotOf(left) || lotOf(right) || 1;
  const strategies = Object.keys(STRATEGY_DEFINITIONS).flatMap((key) => normalizeStrategy(key, data[key], spot, lotSize) ?? []);
  const pick = (key: string | null) => strategies.find((s) => s.key === key) ?? null;
  const active = pick(selectedKey) ?? strategies[0];
  const leftActive = pick(selectedByPane.left);
  const rightActive = pick(selectedByPane.right);
  const ranked = new Map(rankedDecision?.strategies.map((s, i) => [s.key, { ...s, rank: i + 1 }]));
  const visible = strategies
    .filter(
      (s) =>
        (filter === "all" || s.category === filter) &&
        `${s.name} ${s.tagline}`.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => (ranked.get(a.key)?.rank ?? 99) - (ranked.get(b.key)?.rank ?? 99));
  const select = (key: string, pane?: Pane) => {
    if (compareMode) {
      const target = pane ?? focusPane;
      setFocusPane(target);
      setSelectedByPane((prev) => ({ ...prev, [target]: key }));
      return;
    }
    setSelectedKey(key);
    detailRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const onPane = (pane: Pane, decision: Decision) => {
    if (pane === "left") {
      setLeft(decision);
      if (!right && single) setRight(single);
    } else {
      setRight(decision);
      if (!left && single) setLeft(single);
    }
    setSelectedByPane((prev) => {
      const next = { ...prev, [pane]: prev[pane] ?? decision.best?.key ?? null };
      const other = pane === "left" ? "right" : "left";
      if (!next[other] && single?.best?.key) next[other] = single.best.key;
      return next;
    });
  };
  const instrumentId = data.underlying_key?.replace(/^NSE_(INDEX|EQ)\|/, "") || "";
  const companySymbol = company.toUpperCase().trim();
  const companyFullName = (typeof data.company_name === "string" ? data.company_name : "").trim();
  const gridSelectedKey = compareMode ? selectedByPane[focusPane] : active?.key;

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-xl border border-white/12 bg-[#051d4d] p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Option chain</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <h2 className="font-serif text-2xl sm:text-3xl tracking-tight">
                <span>{companySymbol}</span>
                {instrumentId && instrumentId !== companySymbol && (
                  <>
                    <span className="mx-2 text-white/35 font-sans font-light">||</span>
                    <span className="font-mono text-xl sm:text-2xl text-sky-200/90">{instrumentId}</span>
                  </>
                )}
              </h2>
              {spot > 0 && (
                <span className="font-mono text-xl tabular-nums text-sky-300">
                  ₹{spot.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
            {companyFullName && companyFullName !== companySymbol && (
              <p className="mt-0.5 text-xs text-white/55 font-medium">{companyFullName}</p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
              {data.expiry_date && (
                <p>
                  Expiry <span className="font-mono text-white">{data.expiry_date}</span>
                </p>
              )}
              {lotSize > 1 && (
                <p>
                  Lot size <span className="font-mono font-semibold text-sky-300">{lotSize.toLocaleString("en-IN")}</span>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowJson(!showJson)}
            className="rounded border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white"
          >
            {showJson ? "Hide JSON" : "Raw JSON"}
          </button>
        </div>

        {showJson && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
              className="mb-2 text-[11px] text-sky-300 underline hover:text-sky-200"
            >
              Copy
            </button>
            <pre className="max-h-64 overflow-auto rounded border border-white/10 bg-[#020d24] p-3 font-mono text-[11px] leading-relaxed text-sky-200/80">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <RecommendationPanel
        analysisId={analysisId}
        compareMode={compareMode}
        onCompareMode={setCompareMode}
        single={single}
        left={left}
        right={right}
        onSingle={setSingle}
        onPane={onPane}
        onSelect={select}
      />

      {compareMode ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {leftActive ? (
            <StrategyDetail strategy={leftActive} />
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center font-mono text-xs text-white/40">
              Score this view to compare.
            </div>
          )}
          {rightActive ? (
            <StrategyDetail strategy={rightActive} />
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center font-mono text-xs text-white/40">
              Score this view to compare.
            </div>
          )}
        </div>
      ) : (
        active && (
          <div ref={detailRef} className="scroll-mt-20">
            <StrategyDetail strategy={active} />
          </div>
        )
      )}

      <div className="flex flex-col gap-3 border-b border-white/10 pb-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded border px-2.5 py-1 text-xs transition-colors ${
                filter === f.id ? "border-sky-400/50 bg-[#0a276b] text-white" : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {f.label}{" "}
              <span className="font-mono text-[10px] text-white/50">
                {f.id === "all" ? strategies.length : strategies.filter((s) => s.category === f.id).length}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {compareMode && (
            <div className="flex items-center gap-1.5 text-xs text-white/55">
              <span>Cards apply to</span>
              {(["left", "right"] as const).map((pane) => (
                <button
                  key={pane}
                  type="button"
                  onClick={() => setFocusPane(pane)}
                  className={`rounded border px-2 py-1 capitalize ${
                    focusPane === pane ? "border-sky-400/50 bg-[#0a276b] text-white" : "border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {pane}
                </button>
              ))}
            </div>
          )}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search strategy..."
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-sky-400 focus:outline-none sm:w-56"
          />
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((s) => (
            <StrategyCard
              key={s.key}
              strategy={s}
              selected={gridSelectedKey === s.key}
              decision={ranked.get(s.key)}
              recommended={rankedDecision?.best?.key === s.key}
              onSelect={() => select(s.key)}
            />
          ))}
        </div>
      ) : (
        <p className="rounded border border-white/10 p-8 text-center font-mono text-xs text-white/40">NO MATCHING STRATEGIES</p>
      )}
    </div>
  );
}
