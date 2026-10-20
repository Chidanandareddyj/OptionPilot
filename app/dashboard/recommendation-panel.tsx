"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import type { Pane } from "@/lib/analysis";
import type { rankDecision } from "@/lib/decision";
import { inr, STRATEGY_DEFINITIONS, type Category } from "./types";

export type Decision = ReturnType<typeof rankDecision> & { summary?: string | null };

function Summary({ text }: { text: string }) {
  return (
    <div className="space-y-1.5 rounded-xl border border-sky-400/20 bg-sky-500/[0.05] p-4 text-[13px] leading-relaxed text-white/80">
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
const titleCase = (view: Category) => `${view.charAt(0).toUpperCase()}${view.slice(1)} view`;

function RecommendationPane({
  analysisId,
  decision,
  view,
  onViewChange,
  maxLoss,
  onMaxLossChange,
  showMaxLoss,
  compact,
  pane,
  pending,
  disabled,
  emptyHint,
  onPending,
  onDecision,
  onSelect,
}: {
  analysisId?: string;
  decision: Decision | null;
  view: Category;
  onViewChange: (view: Category) => void;
  maxLoss: string;
  onMaxLossChange?: (value: string) => void;
  showMaxLoss: boolean;
  compact: boolean;
  pane?: Pane;
  pending: boolean;
  disabled: boolean;
  emptyHint?: string;
  onPending: (pending: boolean) => void;
  onDecision: (d: Decision) => void;
  onSelect: (key: string) => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  async function decide() {
    if (!analysisId) return;
    setError(null);
    onPending(true);
    try {
      const response = await fetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId,
          view,
          maxLoss: Number(maxLoss),
          ...(pane ? { pane } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Recommendation failed");
      onDecision(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      onPending(false);
    }
  }

  const best = decision?.best && decision.strategies.find((s) => s.key === decision.best!.key);

  const paneBorder = compact
    ? pane === "left"
      ? "border border-emerald-500/20 bg-white/[0.03]"
      : pane === "right"
        ? "border border-rose-500/20 bg-white/[0.03]"
        : "border border-white/12 bg-white/[0.04]"
    : "";

  return (
    <div className={compact ? `rounded-xl ${paneBorder} p-3.5 sm:p-4 transition-all` : undefined}>
      {compact && (
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <h3 className="font-serif text-lg tracking-tight text-white flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                pane === "left"
                  ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                  : pane === "right"
                    ? "bg-rose-400 shadow-sm shadow-rose-400/50"
                    : "bg-sky-400"
              }`}
            />
            <span>{titleCase(view)}</span>
          </h3>
          <span
            className={`font-mono text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5 border ${
              pane === "left"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : pane === "right"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  : "border-white/10 bg-white/5 text-white/50"
            }`}
          >
            {pane ? `${pane} pane` : ""}
          </span>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          decide();
        }}
        className={`flex flex-wrap items-end gap-2.5 ${compact ? "mt-3" : ""}`}
      >
        <label className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
          View
          <select
            value={view}
            onChange={(e) => onViewChange(e.target.value as Category)}
            className="mt-1 block rounded-[5px] border border-white/20 bg-[#020d24] px-2.5 py-1.5 text-xs capitalize text-white focus:border-sky-400 focus:outline-none"
          >
            {VIEWS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        {showMaxLoss && (
          <label className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
            Max loss / trade
            <div className="relative mt-1 flex items-center">
              <span className="pointer-events-none absolute left-2.5 font-mono text-xs text-white/50">₹</span>
              <input
                type="number"
                min={1}
                required
                value={maxLoss}
                onChange={(e) => onMaxLossChange?.(e.target.value)}
                className="block w-32 rounded-[5px] border border-white/20 bg-white/5 py-1.5 pl-6 pr-2.5 font-mono text-xs tabular-nums text-white focus:border-sky-400 focus:outline-none"
              />
            </div>
          </label>
        )}
        <button
          type="submit"
          disabled={pending || disabled || !analysisId}
          title={analysisId ? undefined : "Re-run the analysis to get a recommendation"}
          className="inline-flex items-center gap-2 rounded-[5px] bg-white px-4 py-1.5 text-[12px] font-semibold text-[#0a1f5c] hover:bg-white/90 disabled:opacity-60 shadow-sm transition-all"
        >
          {pending && <ThinkingOrb state="listening" size={20} theme="light" color="#0a1f5c" aria-label="Scoring…" />}
          {pending ? "Scoring…" : decision ? "Re-score" : "Recommend"}
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 font-mono text-xs text-rose-200">{error}</p>
      )}

      {decision ? (
        <div className={`space-y-4 border-t border-white/10 pt-4 ${compact ? "mt-3" : "mt-4"}`}>
          <div className="flex flex-wrap gap-1.5 font-mono tabular-nums text-[11px]">
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
              className={`w-full rounded-xl border transition-all text-left ${
                compact ? "p-3.5" : "p-4"
              } ${
                pane === "right"
                  ? "border-rose-500/30 bg-rose-500/[0.05] hover:bg-rose-500/[0.08]"
                  : "border-emerald-400/40 bg-emerald-500/[0.06] hover:bg-emerald-500/10"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${pane === "right" ? "text-rose-300" : "text-emerald-300"}`}>
                    Recommended · {decision.best!.source === "llm" ? "model pick" : "top quant score"}
                  </p>
                  <h3 className={`mt-1 font-serif text-white tracking-tight ${compact ? "text-xl" : "text-2xl"}`}>{nameOf(best.key)}</h3>
                </div>
                <span className={`font-mono tabular-nums font-bold ${pane === "right" ? "text-rose-300" : "text-emerald-300"} ${compact ? "text-2xl" : "text-3xl"}`}>
                  {best.score.toFixed(0)}
                </span>
              </div>
              {best.metrics && (
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 font-mono tabular-nums text-xs text-white/70">
                  <span>POP <strong className="font-semibold text-white">{pct(best.metrics.pop)}</strong></span>
                  <span>EV <strong className="font-semibold text-white">{inr(best.metrics.ev_per_lot)}</strong></span>
                  <span className="text-rose-300">Max loss <strong className="font-semibold">{inr(best.metrics.max_loss_per_lot)}</strong></span>
                  <span className="text-emerald-300">
                    Max profit <strong className="font-semibold">{best.metrics.max_profit_per_lot == null ? "Unlimited" : inr(best.metrics.max_profit_per_lot)}</strong>
                  </span>
                  {best.metrics.lot_size && best.metrics.lot_size > 1 && (
                    <span className="text-sky-300/80">Lot size <strong className="font-semibold">{best.metrics.lot_size.toLocaleString("en-IN")}</strong></span>
                  )}
                </div>
              )}
            </button>
          ) : (
            <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              No strategy is viable for this view and loss budget. Expand the rows below to see why.
            </p>
          )}

          {decision.summary ? (
            <Summary text={decision.summary} />
          ) : (
            <p className="font-mono text-[11px] text-white/40">Plain-language explanation unavailable for this run.</p>
          )}

          <ol className={`divide-y divide-white/5 rounded-xl border border-white/12 bg-white/[0.04] overflow-hidden ${compact ? "max-h-60 overflow-y-auto" : ""}`}>
            {decision.strategies.map((s, i) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setOpen(open === s.key ? null : s.key)}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-white/[0.04] transition-colors"
                >
                  <span className="w-5 font-mono text-[11px] tabular-nums text-white/40">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-xs sm:text-sm font-medium text-white">{nameOf(s.key)}</span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider ${
                      s.viable ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/10" : "border-rose-500/30 text-rose-300 bg-rose-500/10"
                    }`}
                  >
                    {s.viable ? "viable" : "not viable"}
                  </span>
                  <span className={`h-1.5 w-20 sm:w-24 overflow-hidden rounded bg-white/10 ${compact ? "hidden xl:block" : "hidden sm:block"}`}>
                    <span className="block h-full bg-sky-400" style={{ width: `${s.score}%` }} />
                  </span>
                  <span className="w-8 text-right font-mono text-xs sm:text-sm tabular-nums text-white font-medium">{s.score.toFixed(0)}</span>
                </button>
                {open === s.key && (
                  <div className="space-y-2 border-t border-white/5 bg-[#020d24]/70 px-4 py-3 pl-11">
                    <ul className="list-disc space-y-0.5 pl-4 text-xs text-white/65">
                      {s.reasons.map((r, j) => (
                        <li key={j}>{r}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => onSelect(s.key)}
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-sky-300 hover:text-sky-200 underline pt-1"
                    >
                      <span>Show payoff</span> →
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        emptyHint && <p className="mt-4 font-mono text-[11px] text-white/40">{emptyHint}</p>
      )}
    </div>
  );
}

export default function RecommendationPanel({
  analysisId,
  compareMode,
  onCompareMode,
  single,
  left,
  right,
  onSingle,
  onPane,
  onSelect,
}: {
  analysisId?: string;
  compareMode: boolean;
  onCompareMode: (on: boolean) => void;
  single: Decision | null;
  left: Decision | null;
  right: Decision | null;
  onSingle: (d: Decision) => void;
  onPane: (pane: Pane, d: Decision) => void;
  onSelect: (key: string, pane?: Pane) => void;
}) {
  const budget = single?.max_loss_budget ?? left?.max_loss_budget ?? right?.max_loss_budget ?? 20000;
  const [maxLoss, setMaxLoss] = useState(String(budget));
  const [pending, setPending] = useState<"single" | Pane | null>(null);
  const [singleView, setSingleView] = useState<Category>(single?.view ?? "neutral");
  const [leftView, setLeftView] = useState<Category>(left?.view ?? "bullish");
  const [rightView, setRightView] = useState<Category>(right?.view ?? "bearish");

  useEffect(() => {
    if (left?.view) {
      setLeftView(left.view);
    }
  }, [left?.view]);

  useEffect(() => {
    if (right?.view) {
      setRightView(right.view);
    }
  }, [right?.view]);

  useEffect(() => {
    if (single?.view) {
      setSingleView(single.view);
    }
  }, [single?.view]);

  return (
    <div className="rounded-xl border border-white/12 bg-white/[0.04] p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Recommendation</p>
          <h2 className="mt-1 font-serif text-xl sm:text-2xl tracking-tight text-white">Which strategy fits?</h2>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex cursor-pointer select-none items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:border-white/25 hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e) => onCompareMode(e.target.checked)}
              className="sr-only"
            />
            <span
              className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
                compareMode ? "bg-sky-500" : "bg-white/20"
              }`}
            >
              <span
                className={`inline-block size-3 rounded-full bg-white shadow transition-transform ${
                  compareMode ? "translate-x-3.5" : "translate-x-0.5"
                }`}
              />
            </span>
            <span className={compareMode ? "text-white font-semibold" : "text-white/70"}>Compare views</span>
          </label>
          {compareMode && (
            <label className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Max loss / trade
              <div className="relative mt-1 flex items-center">
                <span className="pointer-events-none absolute left-2.5 font-mono text-xs text-white/50">₹</span>
                <input
                  type="number"
                  min={1}
                  required
                  value={maxLoss}
                  onChange={(e) => setMaxLoss(e.target.value)}
                  className="block w-32 rounded-[5px] border border-white/20 bg-white/5 py-1.5 pl-6 pr-2.5 font-mono text-xs tabular-nums text-white focus:border-sky-400 focus:outline-none"
                />
              </div>
            </label>
          )}
        </div>
      </div>

      {compareMode ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <RecommendationPane
            analysisId={analysisId}
            decision={left}
            view={leftView}
            onViewChange={setLeftView}
            maxLoss={maxLoss}
            showMaxLoss={false}
            compact
            pane="left"
            pending={pending === "left"}
            disabled={pending !== null && pending !== "left"}
            emptyHint="Score this view to compare."
            onPending={(on) => setPending(on ? "left" : null)}
            onDecision={(d) => onPane("left", d)}
            onSelect={(key) => onSelect(key, "left")}
          />
          <RecommendationPane
            analysisId={analysisId}
            decision={right}
            view={rightView}
            onViewChange={setRightView}
            maxLoss={maxLoss}
            showMaxLoss={false}
            compact
            pane="right"
            pending={pending === "right"}
            disabled={pending !== null && pending !== "right"}
            emptyHint="Score this view to compare."
            onPending={(on) => setPending(on ? "right" : null)}
            onDecision={(d) => onPane("right", d)}
            onSelect={(key) => onSelect(key, "right")}
          />
        </div>
      ) : (
        <div className="mt-4">
          <RecommendationPane
            analysisId={analysisId}
            decision={single}
            view={singleView}
            onViewChange={setSingleView}
            maxLoss={maxLoss}
            onMaxLossChange={setMaxLoss}
            showMaxLoss
            compact={false}
            pending={pending === "single"}
            disabled={pending !== null && pending !== "single"}
            onPending={(on) => setPending(on ? "single" : null)}
            onDecision={onSingle}
            onSelect={(key) => onSelect(key)}
          />
        </div>
      )}
    </div>
  );
}
