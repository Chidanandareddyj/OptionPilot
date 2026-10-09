"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import type { rankDecision } from "@/lib/decision";
import { inr, STRATEGY_DEFINITIONS, type Category } from "./types";

export type Decision = ReturnType<typeof rankDecision> & { summary?: string | null };

function Summary({ text }: { text: string }) {
  return (
    <div className="space-y-1.5 rounded-lg border border-sky-400/20 bg-sky-500/[0.05] p-4 text-[13px] leading-relaxed text-white/80">
      {text.split("\n").map((line, i) => {
        const t = line.trim();
        if (!t) return null;
        if (t.startsWith("#")) {
          return (
            <h4 key={i} className="pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300 first:pt-0">
              {t.replace(/^#+\s*/, "")}
            </h4>
          );
        }
        if (/^[-*•]\s/.test(t)) {
          return (
            <p key={i} className="flex gap-2 pl-1">
              <span className="text-sky-300/70">•</span>
              <span>{t.replace(/^[-*•]\s+/, "").replaceAll("**", "")}</span>
            </p>
          );
        }
        return <p key={i}>{t.replaceAll("**", "")}</p>;
      })}
    </div>
  );
}

const VIEWS: Category[] = ["bullish", "bearish", "neutral", "volatile"];
const pct = (n: number | null | undefined) => (n == null ? "—" : `${(n * 100).toFixed(1)}%`);
const nameOf = (key: string) => STRATEGY_DEFINITIONS[key]?.name ?? key;

export default function RecommendationPanel({
  analysisId,
  decision,
  onDecision,
  onSelect,
}: {
  analysisId?: string;
  decision: Decision | null;
  onDecision: (d: Decision) => void;
  onSelect: (key: string) => void;
}) {
  const router = useRouter();
  const [view, setView] = useState<Category>(decision?.view ?? "neutral");
  const [maxLoss, setMaxLoss] = useState(String(decision?.max_loss_budget ?? 20000));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  async function decide() {
    if (!analysisId) return;
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, view, maxLoss: Number(maxLoss) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Recommendation failed");
      onDecision(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  const best = decision?.best && decision.strategies.find((s) => s.key === decision.best!.key);

  return (
    <div className="rounded-xl border border-white/12 bg-[#051d4d] p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Recommendation</p>
          <h2 className="mt-1 font-serif text-xl">Which strategy fits?</h2>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            decide();
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="text-[10px] uppercase tracking-wider text-white/45">
            View
            <select
              value={view}
              onChange={(e) => setView(e.target.value as Category)}
              className="mt-1 block rounded border border-white/15 bg-[#020d24] px-2.5 py-1.5 text-xs capitalize text-white focus:border-sky-400 focus:outline-none"
            >
              {VIEWS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[10px] uppercase tracking-wider text-white/45">
            Max loss / trade (₹)
            <input
              type="number"
              min={1}
              required
              value={maxLoss}
              onChange={(e) => setMaxLoss(e.target.value)}
              className="mt-1 block w-32 rounded border border-white/15 bg-white/5 px-2.5 py-1.5 font-mono text-xs text-white focus:border-sky-400 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={pending || !analysisId}
            title={analysisId ? undefined : "Re-run the analysis to get a recommendation"}
            className="inline-flex items-center gap-2 rounded-[5px] bg-white px-4 py-1.5 text-[12px] font-medium text-[#0a1f5c] hover:bg-white/90 disabled:opacity-60"
          >
            {pending && <ThinkingOrb state="listening" size={20} theme="light" color="#0a1f5c" aria-label="Scoring…" />}
            {pending ? "Scoring…" : decision ? "Re-score" : "Recommend"}
          </button>
        </form>
      </div>

      {error && (
        <p className="mt-3 rounded border border-rose-500/30 bg-rose-500/10 p-2.5 font-mono text-xs text-rose-200">{error}</p>
      )}

      {decision && (
        <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
            {[
              ["ATM IV", pct(decision.atm_iv)],
              ["30d RV", pct(decision.realized_vol_30d)],
              ["IV/RV", decision.iv_rv_ratio?.toFixed(2) ?? "—"],
              ["Lot", String(decision.lot_size)],
              ["DTE", String(decision.days_to_expiry)],
              ["View", decision.view],
              ["Model", decision.llm === "ok" ? "Mercury Decide" : "unavailable (quant only)"],
            ].map(([label, value]) => (
              <span key={label} className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-white/70">
                <span className="text-white/40">{label}</span> {value}
              </span>
            ))}
          </div>

          {best ? (
            <button
              type="button"
              onClick={() => onSelect(best.key)}
              className="w-full rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-4 text-left hover:bg-emerald-500/15"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    Recommended · {decision.best!.source === "llm" ? "model pick" : "top quant score"}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl">{nameOf(best.key)}</h3>
                </div>
                <span className="font-mono text-3xl tabular-nums text-emerald-300">{best.score.toFixed(0)}</span>
              </div>
              {best.metrics && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-white/70">
                  <span>POP {pct(best.metrics.pop)}</span>
                  <span>EV {inr(best.metrics.ev_per_lot)}/lot</span>
                  <span className="text-rose-300">Max loss {inr(best.metrics.max_loss_per_lot)}/lot</span>
                  <span className="text-emerald-300">
                    Max profit {best.metrics.max_profit_per_lot == null ? "Unlimited" : `${inr(best.metrics.max_profit_per_lot)}/lot`}
                  </span>
                </div>
              )}
            </button>
          ) : (
            <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              No strategy is viable for this view and loss budget. Expand the rows below to see why.
            </p>
          )}

          {decision.summary ? (
            <Summary text={decision.summary} />
          ) : (
            <p className="font-mono text-[11px] text-white/40">Plain-language explanation unavailable for this run.</p>
          )}

          <ol className="divide-y divide-white/5 rounded-lg border border-white/10">
            {decision.strategies.map((s, i) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setOpen(open === s.key ? null : s.key)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/[0.03]"
                >
                  <span className="w-5 font-mono text-[11px] text-white/40">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{nameOf(s.key)}</span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                      s.viable ? "border-emerald-500/30 text-emerald-300" : "border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {s.viable ? "viable" : "not viable"}
                  </span>
                  <span className="hidden h-1.5 w-24 overflow-hidden rounded bg-white/10 sm:block">
                    <span className="block h-full bg-sky-400" style={{ width: `${s.score}%` }} />
                  </span>
                  <span className="w-8 text-right font-mono text-sm tabular-nums">{s.score.toFixed(0)}</span>
                </button>
                {open === s.key && (
                  <div className="space-y-2 bg-[#020d24]/60 px-3 pb-3 pl-11">
                    <ul className="list-disc space-y-0.5 pl-4 text-xs text-white/65">
                      {s.reasons.map((r, j) => (
                        <li key={j}>{r}</li>
                      ))}
                    </ul>
                    <button type="button" onClick={() => onSelect(s.key)} className="text-[11px] text-sky-300 underline hover:text-sky-200">
                      Show payoff
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
