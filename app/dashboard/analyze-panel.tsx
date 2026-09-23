"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import StrategyExplorer from "./strategy-explorer";

type HistoryItem = {
  id: string;
  company: string;
  createdAt: string;
  result: unknown;
};

const POPULAR_SYMBOLS = ["NIFTY", "BANKNIFTY", "RELIANCE", "TCS", "HDFCBANK", "INFY"];

function ArrowRight() {
  return (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="size-4 text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function TerminalChartIcon() {
  return (
    <svg className="size-8 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

export default function AnalyzePanel({ history }: { history: HistoryItem[] }) {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [activeCompany, setActiveCompany] = useState<string>(
    history.length > 0 ? history[0].company : ""
  );
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(
    history.length > 0 ? history[0].id : null
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [latest, setLatest] = useState<unknown>(
    history.length > 0 ? history[0].result : null
  );

  async function performAnalysis(targetCompany: string) {
    if (!targetCompany.trim()) return;
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: targetCompany.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }
      setLatest(data);
      setActiveCompany(targetCompany.trim());
      setActiveHistoryId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    await performAnalysis(company);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        {/* Main Terminal Column */}
        <section className="min-w-0">
          {/* Symbol Input Bar */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <form onSubmit={onSubmit} className="flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <input
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  required
                  placeholder="Enter symbol (e.g. NIFTY, BANKNIFTY, RELIANCE)..."
                  className="w-full rounded-md border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/40 focus:border-sky-400 focus:bg-white/10 focus:outline-none font-sans"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="flex items-center justify-center gap-2 rounded-md bg-white px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#0a1f5c] hover:bg-white/90 disabled:opacity-50 transition-colors"
              >
                {pending ? (
                  <>
                    <svg
                      className="h-3.5 w-3.5 animate-spin text-[#0a1f5c]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Calculating…</span>
                  </>
                ) : (
                  <>
                    <span>Analyze</span>
                    <ArrowRight />
                  </>
                )}
              </button>
            </form>

            {/* Quick Symbol Pills */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 font-sans">
                Quick:
              </span>
              {POPULAR_SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => {
                    setCompany(sym);
                    performAnalysis(sym);
                  }}
                  className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
              <AlertIcon />
              <span className="font-mono">{error}</span>
            </div>
          )}

          {/* Loading Skeleton */}
          {pending && (
            <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-6 animate-pulse">
              <div className="h-16 w-full rounded bg-white/5" />
              <div className="h-56 w-full rounded bg-white/5" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="h-40 rounded bg-white/5" />
                <div className="h-40 rounded bg-white/5" />
                <div className="h-40 rounded bg-white/5" />
              </div>
            </div>
          )}

          {/* Strategy Explorer View */}
          {!pending && latest != null && (
            <StrategyExplorer data={latest} companyName={activeCompany || company} />
          )}

          {/* Empty State */}
          {!pending && latest == null && (
            <div className="mt-10 rounded-xl border border-dashed border-white/10 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02]">
                <TerminalChartIcon />
              </div>
              <h3 className="mt-3 font-serif text-lg text-white">
                No active option chain loaded
              </h3>
              <p className="mt-1 text-xs text-white/50 font-sans max-w-sm mx-auto">
                Submit an index or stock symbol above to calculate all 12 option strategies and payoff models.
              </p>
            </div>
          )}
        </section>

        {/* Sidebar: Saved Analyses */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                Saved Snapshots
              </h2>
              <span className="rounded bg-white/10 px-1.5 py-0.2 font-mono text-[10px] tabular-nums text-white/60">
                {history.length}
              </span>
            </div>

            <ul className="mt-3 space-y-2 max-h-[32rem] overflow-y-auto pr-1">
              {history.length === 0 && (
                <li className="py-6 text-center text-xs text-white/40 font-mono">
                  NO SAVED ANALYSES
                </li>
              )}
              {history.map((item) => {
                const isSelected = activeHistoryId === item.id;
                return (
                  <li
                    key={item.id}
                    onClick={() => {
                      setLatest(item.result);
                      setActiveCompany(item.company);
                      setActiveHistoryId(item.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setLatest(item.result);
                        setActiveCompany(item.company);
                        setActiveHistoryId(item.id);
                      }
                    }}
                    className={`group cursor-pointer rounded-lg border p-3 transition-colors text-left ${
                      isSelected
                        ? "border-sky-400/70 bg-[#082054]"
                        : "border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white group-hover:text-sky-200 font-sans">
                        {item.company}
                      </span>
                      {isSelected && (
                        <span className="rounded border border-sky-400/40 bg-sky-400/15 px-1.5 py-0.2 text-[9px] uppercase font-semibold text-sky-300">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="mt-1 font-mono text-[11px] tabular-nums text-white/40">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-sky-300 font-sans">
                        {isSelected ? "Inspecting" : "Load Snapshot"}
                      </span>
                      <span className="text-white/30 group-hover:translate-x-0.5 group-hover:text-white/70 transition-transform">
                        <ArrowRight />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
