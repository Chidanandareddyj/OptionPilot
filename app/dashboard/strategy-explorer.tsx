"use client";

import { useRef, useState } from "react";
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

export default function StrategyExplorer({ data: result, company }: { data: unknown; company: string }) {
  const data = (result ?? {}) as Payload;
  const [filter, setFilter] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const spot = data.underlying_spot_price ?? 0;
  const strategies = Object.keys(STRATEGY_DEFINITIONS).flatMap((key) => normalizeStrategy(key, data[key], spot) ?? []);
  const active = strategies.find((s) => s.key === selectedKey) ?? strategies[0];
  const visible = strategies.filter(
    (s) =>
      (filter === "all" || s.category === filter) &&
      `${s.name} ${s.tagline}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const symbol = data.underlying_key?.replace(/^NSE_(INDEX|EQ)\|/, "") || company;

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-xl border border-white/12 bg-[#051d4d] p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Option chain</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <h2 className="font-serif text-3xl tracking-tight">{symbol}</h2>
              {spot > 0 && (
                <span className="font-mono text-xl tabular-nums text-sky-300">
                  ₹{spot.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
            {data.expiry_date && (
              <p className="mt-1 text-xs text-white/60">
                Expiry <span className="font-mono text-white">{data.expiry_date}</span>
              </p>
            )}
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

      {active && (
        <div ref={detailRef} className="scroll-mt-20">
          <StrategyDetail strategy={active} />
        </div>
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
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search strategy..."
          className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-sky-400 focus:outline-none sm:w-56"
        />
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((s) => (
            <StrategyCard
              key={s.key}
              strategy={s}
              selected={active?.key === s.key}
              onSelect={() => {
                setSelectedKey(s.key);
                detailRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          ))}
        </div>
      ) : (
        <p className="rounded border border-white/10 p-8 text-center font-mono text-xs text-white/40">NO MATCHING STRATEGIES</p>
      )}
    </div>
  );
}
