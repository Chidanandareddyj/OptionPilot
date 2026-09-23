"use client";

import { useMemo, useState } from "react";
import PayoffChart from "./payoff-chart";
import type { NormalizedStrategy } from "./types";

interface StrategyDetailProps {
  strategy: NormalizedStrategy;
  onClose?: () => void;
}

function CloseIcon() {
  return (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function StrategyDetail({ strategy, onClose }: StrategyDetailProps) {
  const [activeTab, setActiveTab] = useState<"payoff" | "table" | "legs">("payoff");

  const {
    name,
    category,
    description,
    spotPrice,
    strikes,
    costOrCredit,
    maxProfit,
    maxLoss,
    breakevens,
    payoffTable,
  } = strategy;

  // Calculate Risk-to-Reward ratio
  const riskRewardRatio = useMemo(() => {
    if (typeof maxProfit === "number" && typeof maxLoss === "number" && maxLoss > 0) {
      return (maxProfit / maxLoss).toFixed(2);
    }
    return null;
  }, [maxProfit, maxLoss]);

  // Find row closest to spot price
  const closestSpotIndex = useMemo(() => {
    if (!payoffTable || payoffTable.length === 0) return -1;
    let closestIdx = 0;
    let minDiff = Infinity;
    payoffTable.forEach((row, i) => {
      const diff = Math.abs(row.closing_price - spotPrice);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });
    return closestIdx;
  }, [payoffTable, spotPrice]);

  // Dynamic leg keys
  const legKeys = useMemo(() => {
    if (!payoffTable || payoffTable.length === 0) return [];
    const first = payoffTable[0];
    return Object.keys(first).filter(
      (k) => k !== "closing_price" && k !== "net_pl"
    );
  }, [payoffTable]);

  const sentimentStyles = {
    bullish: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    bearish: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    neutral: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    volatile: "border-indigo-400/30 bg-indigo-500/10 text-indigo-300",
  }[category];

  return (
    <div className="rounded-xl border border-white/12 bg-[#041944] p-5">
      {/* Strategy Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl font-normal tracking-tight text-white sm:text-3xl">
              {name}
            </h2>
            <span
              className={`rounded border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${sentimentStyles}`}
            >
              {category}
            </span>
          </div>
          <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-white/65 font-sans">
            {description}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
          >
            <CloseIcon />
            <span>Close Inspector</span>
          </button>
        )}
      </div>

      {/* Metrics Strip */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Underlying Spot
          </div>
          <div className="mt-1 font-mono text-base font-medium tabular-nums text-sky-300">
            ₹{spotPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            {costOrCredit.label}
          </div>
          <div className="mt-1 font-mono text-base font-medium tabular-nums text-white">
            ₹{costOrCredit.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Max Profit
          </div>
          <div
            className={`mt-1 font-mono text-base font-medium tabular-nums ${
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

        <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Max Loss
          </div>
          <div
            className={`mt-1 font-mono text-base font-medium tabular-nums ${
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

        <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Breakeven{breakevens.length > 1 ? "s" : ""}
          </div>
          <div className="mt-1 font-mono text-[12px] font-medium tabular-nums text-amber-300">
            {breakevens.length === 0 && <span className="text-white/40">—</span>}
            {breakevens.length === 1 && (
              <span>₹{breakevens[0].toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            )}
            {breakevens.length === 2 && (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-1.5 text-[11px]">
                  <span className="text-white/45 text-[10px] uppercase font-sans">Lower:</span>
                  <span>₹{breakevens[0].toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 text-[11px]">
                  <span className="text-white/45 text-[10px] uppercase font-sans">Upper:</span>
                  <span>₹{breakevens[1].toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
            {breakevens.length > 2 && (
              <div className="flex flex-col gap-0.5 text-[11px]">
                {breakevens.map((b, i) => (
                  <div key={i} className="flex items-center justify-between gap-1.5">
                    <span className="text-white/45 text-[10px] uppercase font-sans">BE {i + 1}:</span>
                    <span>₹{b.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Risk : Reward
          </div>
          <div className="mt-1 font-mono text-base font-medium tabular-nums text-indigo-300">
            {riskRewardRatio ? `1 : ${riskRewardRatio}` : "Uncapped"}
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="mt-6 flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("payoff")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === "payoff"
                ? "border border-sky-400/40 bg-sky-500/15 text-sky-200"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            Payoff Diagram
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("table")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === "table"
                ? "border border-sky-400/40 bg-sky-500/15 text-sky-200"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            Strike Payoff Table ({payoffTable.length} strikes)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("legs")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === "legs"
                ? "border border-sky-400/40 bg-sky-500/15 text-sky-200"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            Option Legs ({strikes.length})
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {activeTab === "payoff" && (
          <div>
            <PayoffChart
              payoffTable={payoffTable}
              spotPrice={spotPrice}
              breakevens={breakevens}
            />

            {/* Configured Legs Bar */}
            {strikes.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] p-2.5 text-xs">
                <span className="font-semibold text-white/40 uppercase tracking-wider text-[10px]">
                  Configured Legs:
                </span>
                {strikes.map((leg, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] tabular-nums text-white/90"
                  >
                    <span
                      className={`font-semibold uppercase ${
                        leg.action === "Buy" ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {leg.action}
                    </span>
                    <span>₹{leg.strike.toLocaleString("en-IN")}</span>
                    <span className="text-white/50 uppercase">{leg.type}</span>
                    {typeof leg.premium === "number" && (
                      <span className="text-white/40">(@₹{leg.premium})</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "table" && (
          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#031536]">
            <div className="max-h-96 overflow-y-auto overflow-x-auto text-xs">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 bg-[#061e4f] text-[10px] uppercase tracking-wider text-white/50 border-b border-white/10">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Closing Strike</th>
                    {legKeys.map((k) => (
                      <th key={k} className="py-2.5 px-3 font-semibold">
                        {k.replace(/_/g, " ")}
                      </th>
                    ))}
                    <th className="py-2.5 px-4 text-right font-semibold">Net P&L</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono tabular-nums">
                  {payoffTable.map((row, idx) => {
                    const isAtm = idx === closestSpotIndex;
                    const isProfitable = row.net_pl > 0;
                    const isZero = row.net_pl === 0;

                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isAtm
                            ? "bg-sky-500/15 font-semibold text-sky-100"
                            : "hover:bg-white/[0.03]"
                        }`}
                      >
                        <td className="py-2 px-4 flex items-center gap-2">
                          <span>₹{row.closing_price.toLocaleString("en-IN")}</span>
                          {isAtm && (
                            <span className="rounded border border-sky-400/40 bg-sky-400/15 px-1.5 py-0.2 text-[9px] uppercase font-sans font-semibold text-sky-300">
                              ATM Spot
                            </span>
                          )}
                        </td>
                        {legKeys.map((k) => (
                          <td key={k} className="py-2 px-3 text-white/70">
                            {row[k] != null ? `₹${row[k]}` : "—"}
                          </td>
                        ))}
                        <td
                          className={`py-2 px-4 text-right font-semibold ${
                            isProfitable
                              ? "text-emerald-400"
                              : isZero
                              ? "text-white/70"
                              : "text-rose-400"
                          }`}
                        >
                          {isProfitable ? "+" : ""}
                          ₹{row.net_pl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[10px] uppercase font-sans font-medium ${
                              isProfitable
                                ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                                : isZero
                                ? "border border-white/10 bg-white/5 text-white/60"
                                : "border border-rose-500/25 bg-rose-500/10 text-rose-300"
                            }`}
                          >
                            {isProfitable ? "Profit" : isZero ? "Even" : "Loss"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "legs" && (
          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#031536]">
            <div className="overflow-x-auto text-xs">
              <table className="w-full border-collapse text-left">
                <thead className="bg-[#061e4f] text-[10px] uppercase tracking-wider text-white/50 border-b border-white/10">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Leg Role</th>
                    <th className="py-2.5 px-3 font-semibold">Action</th>
                    <th className="py-2.5 px-3 font-semibold">Strike Price</th>
                    <th className="py-2.5 px-3 font-semibold">Option Type</th>
                    <th className="py-2.5 px-3 font-semibold">Premium (LTP)</th>
                    <th className="py-2.5 px-4 font-semibold">Instrument Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono tabular-nums">
                  {strikes.map((leg, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.03]">
                      <td className="py-2.5 px-4 font-sans font-medium text-white">
                        {leg.label}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] uppercase font-semibold font-sans ${
                            leg.action === "Buy"
                              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                              : "border-amber-500/30 bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {leg.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-white">
                        ₹{leg.strike.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-white/70 uppercase">
                        {leg.type}
                      </td>
                      <td className="py-2.5 px-3 text-white">
                        {typeof leg.premium === "number" ? `₹${leg.premium}` : "—"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-white/40 truncate max-w-xs">
                        {leg.instrumentKey || "—"}
                      </td>
                    </tr>
                  ))}
                  {strikes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-white/40 font-sans">
                        No specific leg details found for this strategy.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
