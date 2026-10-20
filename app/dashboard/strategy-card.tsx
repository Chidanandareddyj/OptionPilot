import { CATEGORY_BADGE, inr, keyMetrics, type NormalizedStrategy } from "./types";

export default function StrategyCard({
  strategy,
  selected,
  decision,
  recommended,
  onSelect,
}: {
  strategy: NormalizedStrategy;
  selected: boolean;
  decision?: {
    score: number;
    viable: boolean;
    rank: number;
    metrics?: {
      pop?: number;
      ev_per_lot?: number;
      max_profit_per_lot?: number | null;
      max_loss_per_lot?: number;
      reward_risk?: number | null;
      lot_size?: number;
    } | null;
  };
  recommended?: boolean;
  onSelect: () => void;
}) {
  const km = keyMetrics(strategy);
  const roi =
    decision?.metrics?.reward_risk != null
      ? `${decision.metrics.reward_risk.toFixed(2)}×`
      : typeof strategy.maxProfit === "number" && typeof strategy.maxLoss === "number" && strategy.maxLoss > 0
        ? `${((strategy.maxProfit / strategy.maxLoss) * 100).toFixed(0)}%`
        : null;
  const ev = decision?.metrics?.ev_per_lot != null ? inr(decision.metrics.ev_per_lot) : null;
  const pop = decision?.metrics?.pop != null ? `${(decision.metrics.pop * 100).toFixed(1)}%` : null;

  const displayMetrics = [
    ...km,
    ...(ev ? [{ label: "EV", value: ev, tone: "text-sky-300 font-semibold" }] : []),
    ...(pop ? [{ label: "POP", value: pop, tone: "text-emerald-300 font-semibold" }] : []),
    ...(roi && !ev ? [{ label: "ROI", value: roi, tone: "text-indigo-300 font-semibold" }] : []),
  ];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex flex-col rounded-xl text-left transition-all p-3.5 sm:p-4 ${
        selected
          ? "border border-sky-400 bg-[#082054] shadow-md shadow-sky-500/10 ring-1 ring-sky-400/40"
          : recommended
            ? "border border-emerald-400/50 bg-emerald-500/[0.06] hover:bg-emerald-500/10"
            : "border border-white/12 bg-white/[0.04] hover:bg-white/[0.07]"
      }`}
    >
      {decision && (
        <div className="mb-2.5 flex items-center justify-between gap-2 font-mono tabular-nums text-[11px]">
          <span className={recommended ? "font-semibold text-emerald-300" : "text-white/45"}>
            {recommended ? "★ Recommended" : `#${decision.rank}`}
          </span>
          <span className={decision.viable ? "text-emerald-300" : "text-rose-300"}>
            {decision.viable ? "viable" : "not viable"} · <span className="text-white font-medium">{decision.score.toFixed(0)}</span>/100
          </span>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${CATEGORY_BADGE[strategy.category]}`}>
          {strategy.category}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-white/45">
          {strategy.legs.map((l) => l.strike).join(" / ")}
        </span>
      </div>
      <h3 className="mt-2.5 font-serif text-[17px] tracking-tight text-white group-hover:text-sky-200 transition-colors">{strategy.name}</h3>
      <p className="mt-0.5 line-clamp-1 text-xs text-white/55">{strategy.tagline}</p>

      <dl className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/10 pt-3">
        {displayMetrics.map((m) => (
          <div key={m.label}>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-white/40">{m.label}</dt>
            <dd className={`mt-0.5 font-mono text-[12px] tabular-nums ${m.tone}`}>{m.value}</dd>
          </div>
        ))}
      </dl>
    </button>
  );
}
