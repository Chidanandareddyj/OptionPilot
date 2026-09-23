"use client";

import type { NormalizedStrategy } from "./types";

interface StrategyCardProps {
  strategy: NormalizedStrategy;
  isSelected: boolean;
  onSelect: () => void;
}

function ArrowUpRight() {
  return (
    <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  );
}

function ArrowDownRight() {
  return (
    <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
    </svg>
  );
}

function RangeIcon() {
  return (
    <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6h16.5" />
    </svg>
  );
}

function VolatilityIcon() {
  return (
    <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h18m-4.5-9L21 12m0 0l-4.5 4.5M21 12H3" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

export default function StrategyCard({
  strategy,
  isSelected,
  onSelect,
}: StrategyCardProps) {
  const { name, category, tagline, strikes, costOrCredit, maxProfit, maxLoss, breakevens } =
    strategy;

  const sentimentMeta = {
    bullish: {
      badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
      icon: <ArrowUpRight />,
      label: "Bullish",
    },
    bearish: {
      badge: "border-rose-500/25 bg-rose-500/10 text-rose-400",
      icon: <ArrowDownRight />,
      label: "Bearish",
    },
    neutral: {
      badge: "border-sky-500/25 bg-sky-500/10 text-sky-300",
      icon: <RangeIcon />,
      label: "Neutral",
    },
    volatile: {
      badge: "border-indigo-400/25 bg-indigo-500/10 text-indigo-300",
      icon: <VolatilityIcon />,
      label: "Volatile",
    },
  }[category];

  // Strikes summary
  const strikesText =
    strikes.length === 1
      ? `Strike: ${strikes[0].strike}`
      : strikes.length === 2
      ? `${strikes[0].strike} / ${strikes[1].strike}`
      : strikes.length === 3
      ? `${strikes[0].strike} / ${strikes[1].strike} / ${strikes[2].strike}`
      : `${strikes.length} Legs`;

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group relative flex flex-col justify-between rounded-lg border p-4 text-left transition-colors duration-150 cursor-pointer ${
        isSelected
          ? "border-sky-400/80 bg-[#092257] ring-1 ring-sky-400/40"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sentimentMeta.badge}`}
          >
            {sentimentMeta.icon}
            <span>{sentimentMeta.label}</span>
          </span>
          <span className="font-mono text-[11px] text-white/45 tabular-nums">{strikesText}</span>
        </div>

        <h3 className="mt-2.5 font-serif text-[17px] font-medium tracking-normal text-white group-hover:text-sky-200">
          {name}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-white/55 font-sans">{tagline}</p>
      </div>

      <div className="mt-3.5 border-t border-white/8 pt-3">
        <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              {costOrCredit.label}
            </div>
            <div className="mt-0.5 font-mono text-[13px] font-medium tabular-nums text-white/90">
              ₹{costOrCredit.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              Max Profit
            </div>
            <div
              className={`mt-0.5 font-mono text-[13px] font-medium tabular-nums ${
                maxProfit === "Unlimited"
                  ? "text-emerald-400"
                  : typeof maxProfit === "number" && maxProfit > 0
                  ? "text-emerald-400"
                  : "text-white/80"
              }`}
            >
              {maxProfit === "Unlimited"
                ? "Unlimited"
                : maxProfit !== null
                ? `₹${maxProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                : "—"}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              Max Loss
            </div>
            <div
              className={`mt-0.5 font-mono text-[13px] font-medium tabular-nums ${
                maxLoss === "Unlimited"
                  ? "text-rose-400"
                  : typeof maxLoss === "number" && maxLoss > 0
                  ? "text-rose-400"
                  : "text-white/80"
              }`}
            >
              {maxLoss === "Unlimited"
                ? "Unlimited"
                : maxLoss !== null
                ? `₹${maxLoss.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                : "—"}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              Breakeven{breakevens.length > 1 ? "s" : ""}
            </div>
            <div className="mt-0.5 font-mono text-[11px] font-medium tabular-nums text-amber-300">
              {breakevens.length === 0 && <span className="text-white/40">—</span>}
              {breakevens.length === 1 && (
                <span>₹{breakevens[0].toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              )}
              {breakevens.length === 2 && (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-white/40 text-[9px] uppercase font-sans">Lower:</span>
                    <span>₹{breakevens[0].toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-white/40 text-[9px] uppercase font-sans">Upper:</span>
                    <span>₹{breakevens[1].toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
              {breakevens.length > 2 && (
                <div className="flex flex-col gap-0.5">
                  {breakevens.map((b, i) => (
                    <div key={i} className="flex items-center justify-between gap-1">
                      <span className="text-white/40 text-[9px] uppercase font-sans">BE {i + 1}:</span>
                      <span>₹{b.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[11px]">
        <span
          className={`font-sans font-medium transition-colors ${
            isSelected ? "text-sky-300" : "text-white/40 group-hover:text-white/70"
          }`}
        >
          {isSelected ? "Active Strategy" : "Inspect Strategy"}
        </span>
        <span className="text-white/40 group-hover:translate-x-0.5 group-hover:text-white/80 transition-all">
          <ChevronRight />
        </span>
      </div>
    </div>
  );
}
