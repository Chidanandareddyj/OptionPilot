import { CATEGORY_BADGE, keyMetrics, type NormalizedStrategy } from "./types";

export default function StrategyCard({
  strategy,
  selected,
  onSelect,
}: {
  strategy: NormalizedStrategy;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex flex-col rounded-lg border p-4 text-left transition-colors ${
        selected
          ? "border-sky-400/80 bg-[#092257] ring-1 ring-sky-400/40"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${CATEGORY_BADGE[strategy.category]}`}>
          {strategy.category}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-white/45">
          {strategy.legs.map((l) => l.strike).join(" / ")}
        </span>
      </div>
      <h3 className="mt-2.5 font-serif text-[17px] text-white group-hover:text-sky-200">{strategy.name}</h3>
      <p className="mt-0.5 line-clamp-1 text-xs text-white/55">{strategy.tagline}</p>

      <dl className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/10 pt-3">
        {keyMetrics(strategy).map((m) => (
          <div key={m.label}>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-white/40">{m.label}</dt>
            <dd className={`mt-0.5 font-mono text-[12px] tabular-nums ${m.tone}`}>{m.value}</dd>
          </div>
        ))}
      </dl>
    </button>
  );
}
