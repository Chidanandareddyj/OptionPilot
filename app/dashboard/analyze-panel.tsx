"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { filterSymbols, NSE_FO_SYMBOLS, POPULAR_COMPANIES, QUICK, type Suggestion } from "./fo-symbols";
import StrategyExplorer from "./strategy-explorer";

type Snapshot = {
  id?: string;
  company: string;
  createdAt?: Date;
  result: unknown;
  decision?: unknown;
};

type DerivativeQuote = {
  symbol: string;
  available: boolean;
  name: string | null;
  expiry: string | null;
  spot: number | null;
  underlying_key: string | null;
};

const DERIVATIVE_CHUNK = 8;


// ---------------------------------------------------------------------------
// SymbolSearch — Interactive combobox with autocomplete & instant suggestions
// ---------------------------------------------------------------------------
function SymbolSearch({
  value,
  onChange,
  onSelect,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (v: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(POPULAR_COMPANIES);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    onChange(v);
    setActiveIdx(-1);
    setSuggestions(filterSymbols(v));
    setOpen(true);
  }

  function handleInputFocus() {
    setSuggestions(filterSymbols(value));
    setOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setSuggestions(filterSymbols(value));
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        e.preventDefault();
        const selected = suggestions[activeIdx];
        onSelect(selected.symbol);
        setOpen(false);
        setActiveIdx(-1);
      } else {
        // If no suggestion highlighted, let form submit with the current input value
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  function handleSelectSuggestion(s: Suggestion) {
    onSelect(s.symbol);
    setOpen(false);
    setActiveIdx(-1);
  }

  function handleClear() {
    onChange("");
    setSuggestions(POPULAR_COMPANIES);
    setActiveIdx(-1);
    inputRef.current?.focus();
  }

  const isQueryEmpty = !value.trim();

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="pointer-events-none absolute left-3.5 text-white/40">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required
          autoComplete="off"
          placeholder="Search F&O symbol or company name (e.g. SBIN, TATAMOTORS, LT)..."
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
          className="w-full rounded-md border border-white/15 bg-white/5 py-2 pl-9 pr-8 text-sm text-white placeholder:text-white/40 focus:border-sky-400 focus:bg-white/[0.08] focus:outline-none disabled:opacity-60"
        />

        {/* Clear Button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white/40 hover:bg-white/10 hover:text-white"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-white/15 bg-[#06183d] shadow-2xl shadow-black/60 backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            <span>{isQueryEmpty ? "Popular F&O Stocks (Click to Analyze)" : "Matching Derivatives"}</span>
            <span className="font-mono text-[9px] text-sky-400/80">
              {suggestions.length} {suggestions.length === 1 ? "result" : "results"}
            </span>
          </div>

          {suggestions.length > 0 ? (
            <ul role="listbox" className="max-h-72 overflow-y-auto divide-y divide-white/5 py-1">
              {suggestions.map((s, i) => (
                <li
                  key={s.symbol}
                  role="option"
                  aria-selected={i === activeIdx}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(s);
                  }}
                  className={`flex cursor-pointer items-center justify-between px-3.5 py-2 text-sm transition-colors ${
                    i === activeIdx
                      ? "bg-sky-500/25 text-white"
                      : "text-white/85 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <div className="flex items-baseline gap-2.5 min-w-0">
                    <span className="shrink-0 font-mono text-[13px] font-bold text-sky-300">
                      {s.symbol}
                    </span>
                    <span className="truncate text-xs text-white/60">{s.name}</span>
                  </div>
                  {s.sector && (
                    <span className="ml-2 shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-white/40">
                      {s.sector}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-xs text-white/50">
              <p>No predefined match for &ldquo;<span className="text-sky-300">{value}</span>&rdquo;</p>
              <p className="mt-1 text-[11px] text-white/35">Press <span className="font-mono text-white/60">Enter</span> or click <span className="text-white/60">Analyze</span> to query directly</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatSpot(spot: number | null | undefined) {
  if (spot == null || !Number.isFinite(spot)) return null;
  return `₹${spot.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatExpiry(expiry: string | null | undefined) {
  if (!expiry) return null;
  const parsed = new Date(`${expiry.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return expiry;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function DerivativeCatalog({
  quotes,
  query,
  onQuery,
  pending,
  onOpen,
}: {
  quotes: Record<string, DerivativeQuote>;
  query: string;
  onQuery: (value: string) => void;
  pending: boolean;
  onOpen: (symbol: string) => void;
}) {
  const needle = query.trim().toUpperCase();
  const rows = NSE_FO_SYMBOLS.filter((item) => {
    if (!needle) return true;
    return (
      item.symbol.toUpperCase().includes(needle) ||
      item.name.toUpperCase().includes(needle) ||
      (item.sector ?? "").toUpperCase().includes(needle)
    );
  });
  const loaded = NSE_FO_SYMBOLS.filter((item) => quotes[item.symbol]).length;

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">NSE F&O catalog</p>
          <p className="mt-1 font-mono text-[11px] text-white/45">
            {loaded}/{NSE_FO_SYMBOLS.length} quotes
            {loaded < NSE_FO_SYMBOLS.length ? " · loading spot and expiry" : ""}
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Filter symbol, name, or sector"
          aria-label="Filter derivatives"
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/35 focus:border-sky-400 focus:outline-none sm:w-64"
        />
      </div>
      <div className="max-h-[36rem] overflow-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#06183d] text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            <tr>
              <th className="px-4 py-2 font-semibold">Symbol</th>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Sector</th>
              <th className="px-3 py-2 text-right font-semibold">Spot</th>
              <th className="px-4 py-2 font-semibold">Expiry</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const quote = quotes[item.symbol];
              const unavailable = quote?.available === false;
              const spot = formatSpot(quote?.spot);
              const expiry = formatExpiry(quote?.expiry);
              return (
                <tr
                  key={item.symbol}
                  tabIndex={unavailable ? -1 : 0}
                  aria-disabled={unavailable || undefined}
                  onClick={() => {
                    if (unavailable || pending) return;
                    onOpen(item.symbol);
                  }}
                  onKeyDown={(e) => {
                    if (unavailable || pending) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpen(item.symbol);
                    }
                  }}
                  className={`border-t border-white/5 ${
                    unavailable
                      ? "cursor-not-allowed opacity-45"
                      : "cursor-pointer hover:bg-white/[0.05] focus:bg-sky-500/15 focus:outline-none"
                  }`}
                  title={unavailable ? "No F&O contract from Upstox" : `Open ${item.symbol}`}
                >
                  <td className="px-4 py-2.5 font-mono text-[13px] font-bold text-sky-300">{item.symbol}</td>
                  <td className="max-w-[16rem] truncate px-3 py-2.5 text-xs text-white/75">{item.name}</td>
                  <td className="px-3 py-2.5">
                    {item.sector && (
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-white/45">{item.sector}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-white">
                    {quote == null ? (
                      <span className="inline-block h-3 w-16 animate-pulse rounded bg-white/10" />
                    ) : unavailable ? (
                      <span className="text-white/40">No F&O</span>
                    ) : (
                      (spot ?? "—")
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-white/80">
                    {quote == null ? (
                      <span className="inline-block h-3 w-20 animate-pulse rounded bg-white/10" />
                    ) : (
                      (expiry ?? "—")
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-white/45">
                  No catalog match for “{query.trim()}”
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AnalyzePanel
// ---------------------------------------------------------------------------
export default function AnalyzePanel({ history }: { history: Snapshot[] }) {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [active, setActive] = useState<Snapshot | null>(history[0] ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [browse, setBrowse] = useState(false);
  const [quotes, setQuotes] = useState<Record<string, DerivativeQuote>>({});
  const [browseQuery, setBrowseQuery] = useState("");
  const browseGeneration = useRef(0);

  useEffect(() => {
    const generation = ++browseGeneration.current;
    if (!browse) return;

    // ponytail: sequential chunks, ~20 round trips / ~30–60s; upgrade is higher concurrency or an instruments master file.
    const symbols = NSE_FO_SYMBOLS.map((item) => item.symbol);
    const received = new Set<string>();
    let cancelled = false;

    async function loadQuotes() {
      for (let index = 0; index < symbols.length; index += DERIVATIVE_CHUNK) {
        if (cancelled || browseGeneration.current !== generation) return;
        const chunk = symbols.slice(index, index + DERIVATIVE_CHUNK);
        try {
          const response = await fetch("/api/derivatives", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbols: chunk }),
          });
          const data = await response.json().catch(() => null);
          if (cancelled || browseGeneration.current !== generation) return;
          if (!response.ok) {
            if (response.status === 401) {
              setError("Sign in to load live derivative quotes.");
              return;
            }
            continue;
          }
          const rows = Array.isArray(data?.derivatives) ? (data.derivatives as DerivativeQuote[]) : [];
          for (const row of rows) received.add(row.symbol);
          setQuotes((current) => {
            const next = { ...current };
            for (const row of rows) next[row.symbol] = row;
            return next;
          });
        } catch {
          if (cancelled || browseGeneration.current !== generation) return;
        }
      }

      if (cancelled || browseGeneration.current !== generation) return;
      const missing = symbols.filter((symbol) => !received.has(symbol));
      if (missing.length === 0) return;
      setError("Some derivative quotes could not be loaded.");
      setQuotes((current) => {
        const next = { ...current };
        for (const symbol of missing) {
          if (next[symbol]) continue;
          next[symbol] = {
            symbol,
            available: true,
            name: null,
            expiry: null,
            spot: null,
            underlying_key: null,
          };
        }
        return next;
      });
    }

    void loadQuotes();
    return () => {
      cancelled = true;
    };
  }, [browse]);

  async function analyze(target: string) {
    target = target.trim();
    if (!target) return;
    setBrowse(false);
    setCompany(target);
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: target }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");
      const { id, ...result } = data;
      setActive({ id, company: target, result });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:px-8">
      <section className="min-w-0">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              analyze(company);
            }}
            className="flex flex-col gap-2.5 sm:flex-row"
          >
            <SymbolSearch
              value={company}
              onChange={setCompany}
              onSelect={(symbol) => {
                analyze(symbol);
              }}
              disabled={pending}
            />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-[5px] bg-white px-5 py-2 text-[12px] font-medium text-[#0a1f5c] hover:bg-white/90 disabled:opacity-70"
            >
              {pending && (
                <ThinkingOrb state="listening" size={20} theme="light" color="#0a1f5c" aria-label="Listening…" />
              )}
              {pending ? "Calculating…" : "Analyze"}
            </button>
          </form>

          {/* Quick-access chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Quick</span>
            {QUICK.map((sym) => (
              <button
                key={sym}
                type="button"
                disabled={pending}
                onClick={() => {
                  analyze(sym);
                }}
                className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                {sym}
              </button>
            ))}
            <span className="mx-1 hidden h-3 w-px bg-white/15 sm:inline-block" aria-hidden />
            <button
              type="button"
              aria-pressed={browse}
              disabled={pending}
              onClick={() => setBrowse((on) => !on)}
              className={`rounded border px-2.5 py-0.5 text-[11px] font-medium ${
                browse
                  ? "border-sky-300 bg-sky-500/25 text-white"
                  : "border-sky-400/40 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20"
              } disabled:opacity-50`}
            >
              Show all derivatives values
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 font-mono text-xs text-rose-200">{error}</p>
        )}

        {browse && !pending ? (
          <DerivativeCatalog
            quotes={quotes}
            query={browseQuery}
            onQuery={setBrowseQuery}
            pending={pending}
            onOpen={(symbol) => {
              void analyze(symbol);
            }}
          />
        ) : pending ? (
          <div className="mt-6 animate-pulse space-y-3 rounded-xl border border-white/10 p-4 sm:p-6">
            <div className="h-16 rounded bg-white/5" />
            <div className="h-56 rounded bg-white/5" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-40 rounded bg-white/5" />
              <div className="h-40 rounded bg-white/5" />
            </div>
          </div>
        ) : active ? (
          <StrategyExplorer
            key={active.id ?? "latest"}
            data={active.result}
            company={active.company}
            analysisId={active.id}
            decision={active.decision}
          />
        ) : (
          <div className="mt-10 rounded-xl border border-dashed border-white/10 p-10 text-center">
            <h3 className="font-serif text-lg">No option chain loaded</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-white/50">
              Enter an index or stock symbol above to price all 12 strategies and their payoffs.
            </p>
          </div>
        )}
      </section>

      <aside className="order-first min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4 lg:order-none lg:self-start">
        <h2 className="flex items-center justify-between border-b border-white/10 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
          Saved snapshots
          <span className="font-mono tracking-normal text-white/60">{history.length}</span>
        </h2>
        {history.length === 0 ? (
          <p className="py-6 text-center font-mono text-xs text-white/40">NO SAVED ANALYSES</p>
        ) : (
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:max-h-[32rem] lg:flex-col lg:overflow-y-auto lg:pb-0 lg:pr-1">
            {history.map((item) => (
              <li key={item.id} className="w-44 shrink-0 lg:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setBrowse(false);
                    setActive(item);
                  }}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    active?.id === item.id
                      ? "border-sky-400/70 bg-[#082054]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="truncate text-sm font-semibold">{item.company}</div>
                  <div className="mt-1 font-mono text-[11px] text-white/40">
                    {item.createdAt?.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
