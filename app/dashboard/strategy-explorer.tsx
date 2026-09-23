"use client";

import { useMemo, useState } from "react";
import StrategyCard from "./strategy-card";
import StrategyDetail from "./strategy-detail";
import {
  type AnalysisApiResponse,
  type NormalizedStrategy,
  type SentimentCategory,
  normalizeStrategy,
} from "./types";

interface StrategyExplorerProps {
  data: unknown;
  companyName?: string;
}

function SearchIcon() {
  return (
    <svg className="size-3.5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="size-3 text-white/50 hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function StrategyExplorer({ data, companyName }: StrategyExplorerProps) {
  const [selectedSentiment, setSelectedSentiment] = useState<SentimentCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStrategyKey, setSelectedStrategyKey] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // Extract underlying metadata and normalized strategies list
  const { underlying, strategies } = useMemo(() => {
    if (!data || typeof data !== "object") {
      return { underlying: null, strategies: [] };
    }

    const payload = data as AnalysisApiResponse;
    const spot = typeof payload.underlying_spot_price === "number"
      ? payload.underlying_spot_price
      : 0;

    const underlyingInfo = {
      key: payload.underlying_key || companyName || "Unknown Asset",
      cleanSymbol: (payload.underlying_key || companyName || "")
        .replace(/^NSE_INDEX\||^NSE_EQ\|/, "")
        .trim(),
      expiry: payload.expiry_date || null,
      spotPrice: spot,
    };

    const parsed: NormalizedStrategy[] = [];

    const ignoredKeys = new Set([
      "underlying_key",
      "expiry_date",
      "underlying_spot_price",
      "options",
      "error",
      "success",
      "status",
    ]);

    Object.keys(payload).forEach((key) => {
      if (ignoredKeys.has(key)) return;
      const val = payload[key];
      const normalized = normalizeStrategy(key, val, spot);
      if (normalized) {
        parsed.push(normalized);
      }
    });

    return {
      underlying: underlyingInfo,
      strategies: parsed,
    };
  }, [data, companyName]);

  // Set default selected strategy
  const activeStrategy = useMemo(() => {
    if (strategies.length === 0) return null;
    if (selectedStrategyKey) {
      const found = strategies.find((s) => s.key === selectedStrategyKey);
      if (found) return found;
    }
    return strategies[0];
  }, [strategies, selectedStrategyKey]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts = { all: strategies.length, bullish: 0, bearish: 0, neutral: 0, volatile: 0 };
    strategies.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, [strategies]);

  // Filtered strategies
  const filteredStrategies = useMemo(() => {
    return strategies.filter((s) => {
      const matchesCategory =
        selectedSentiment === "all" || s.category === selectedSentiment;
      const matchesSearch =
        searchQuery === "" ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [strategies, selectedSentiment, searchQuery]);

  if (!data) return null;

  return (
    <div className="mt-6 space-y-5">
      {/* Asset Header Banner */}
      <div className="rounded-xl border border-white/12 bg-[#051d4d] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 font-sans">
                Active Options Chain
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <h2 className="font-serif text-3xl font-medium tracking-tight text-white">
                {underlying?.cleanSymbol || companyName || "Asset Options"}
              </h2>
              {underlying && underlying.spotPrice > 0 && (
                <span className="font-mono text-xl font-medium tabular-nums text-sky-300">
                  ₹{underlying.spotPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
            {underlying?.expiry && (
              <p className="mt-1 text-xs text-white/60 font-sans">
                Expiration: <strong className="text-white font-mono">{underlying.expiry}</strong>
                {underlying.key && underlying.key !== underlying.cleanSymbol && (
                  <span className="ml-2 font-mono text-[11px] text-white/40">[{underlying.key}]</span>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs tabular-nums text-white/80">
              {strategies.length} Strategies
            </span>
            <button
              type="button"
              onClick={() => setShowRawJson(!showRawJson)}
              className="rounded border border-white/15 bg-white/5 px-3 py-1 text-xs font-sans font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              {showRawJson ? "Hide Raw JSON" : "Inspect Raw JSON"}
            </button>
          </div>
        </div>

        {/* Raw JSON Inspector */}
        {showRawJson && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <div className="flex items-center justify-between pb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                API Response Payload
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                }}
                className="font-sans text-[11px] text-sky-300 underline hover:text-sky-200"
              >
                Copy to clipboard
              </button>
            </div>
            <pre className="max-h-64 overflow-auto rounded border border-white/10 bg-[#020d24] p-3 text-[11px] font-mono leading-relaxed text-sky-200/80">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Strategy Detail View */}
      {activeStrategy && (
        <div id="strategy-detail-panel">
          <StrategyDetail
            strategy={activeStrategy}
            onClose={() => setSelectedStrategyKey(null)}
          />
        </div>
      )}

      {/* Sentiment Filter Tabs & Search */}
      <div className="space-y-3.5 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          {/* Sentiment Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all" as const, label: "All Strategies", count: categoryCounts.all },
              { id: "bullish" as const, label: "Bullish", count: categoryCounts.bullish },
              { id: "bearish" as const, label: "Bearish", count: categoryCounts.bearish },
              { id: "neutral" as const, label: "Neutral / Range", count: categoryCounts.neutral },
              { id: "volatile" as const, label: "Volatile", count: categoryCounts.volatile },
            ].map((tab) => {
              const isActive = selectedSentiment === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedSentiment(tab.id)}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-sans transition-colors ${
                    isActive
                      ? "border border-sky-400/50 bg-[#0a276b] text-white font-medium"
                      : "border border-transparent text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 font-mono text-[10px] tabular-nums ${
                      isActive ? "bg-sky-400/20 text-sky-200" : "bg-white/10 text-white/50"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Strategy */}
          <div className="relative min-w-[13rem] max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search strategy..."
              className="w-full rounded border border-white/10 bg-white/5 pl-8 pr-7 py-1 text-xs text-white placeholder:text-white/40 focus:border-sky-400 focus:outline-none font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-2 flex items-center"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </div>

        {/* Strategy Grid */}
        {filteredStrategies.length > 0 ? (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStrategies.map((strategy) => (
              <StrategyCard
                key={strategy.key}
                strategy={strategy}
                isSelected={activeStrategy?.key === strategy.key}
                onSelect={() => {
                  setSelectedStrategyKey(strategy.key);
                  const el = document.getElementById("strategy-detail-panel");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded border border-white/10 bg-white/[0.02] p-8 text-center text-xs text-white/40 font-mono">
            NO STRATEGIES MATCHING FILTER CRITERIA
          </div>
        )}
      </div>
    </div>
  );
}
