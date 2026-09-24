"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import StrategyExplorer from "./strategy-explorer";

type Snapshot = {
  id?: string;
  company: string;
  createdAt?: Date;
  result: unknown;
};

const QUICK = ["NIFTY", "BANKNIFTY", "RELIANCE", "TCS", "HDFCBANK", "INFY"];

export default function AnalyzePanel({ history }: { history: Snapshot[] }) {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [active, setActive] = useState<Snapshot | null>(history[0] ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function analyze(target: string) {
    target = target.trim();
    if (!target) return;
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
      setActive({ company: target, result: data });
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
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              placeholder="Symbol, e.g. NIFTY or RELIANCE"
              className="flex-1 rounded-md border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/40 focus:border-sky-400 focus:outline-none"
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
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Quick</span>
            {QUICK.map((sym) => (
              <button
                key={sym}
                type="button"
                disabled={pending}
                onClick={() => {
                  setCompany(sym);
                  analyze(sym);
                }}
                className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 font-mono text-xs text-rose-200">{error}</p>
        )}

        {pending ? (
          <div className="mt-6 animate-pulse space-y-3 rounded-xl border border-white/10 p-4 sm:p-6">
            <div className="h-16 rounded bg-white/5" />
            <div className="h-56 rounded bg-white/5" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-40 rounded bg-white/5" />
              <div className="h-40 rounded bg-white/5" />
            </div>
          </div>
        ) : active ? (
          <StrategyExplorer key={active.id ?? "latest"} data={active.result} company={active.company} />
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
                  onClick={() => setActive(item)}
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
