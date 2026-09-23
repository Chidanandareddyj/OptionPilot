"use client";

import { useState } from "react";
import PayoffChart from "./payoff-chart";
import { CATEGORY_BADGE, inr, keyMetrics, type NormalizedStrategy } from "./types";

const TABS = [
  { id: "payoff", label: "Payoff" },
  { id: "table", label: "Payoff table" },
  { id: "legs", label: "Legs" },
] as const;

const TH = "px-3 py-2.5 font-semibold first:pl-4 last:pr-4";
const TD = "px-3 py-2 first:pl-4 last:pr-4";

export default function StrategyDetail({ strategy }: { strategy: NormalizedStrategy }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("payoff");
  const { name, category, description, spotPrice, legs, maxProfit, maxLoss, breakevens, payoffTable } = strategy;

  const legColumns = Object.keys(payoffTable[0] ?? {}).filter((k) => k !== "closing_price" && k !== "net_pl");
  const atmIndex = payoffTable.reduce(
    (best, row, i) =>
      Math.abs(row.closing_price - spotPrice) < Math.abs(payoffTable[best].closing_price - spotPrice) ? i : best,
    0,
  );
  const metrics = [
    { label: "Spot", value: inr(spotPrice), tone: "text-sky-300" },
    ...keyMetrics(strategy),
    {
      label: "Risk : reward",
      value: typeof maxProfit === "number" && typeof maxLoss === "number" && maxLoss > 0 ? `1 : ${(maxProfit / maxLoss).toFixed(2)}` : "Uncapped",
      tone: "text-indigo-300",
    },
  ];

  return (
    <div className="rounded-xl border border-white/12 bg-[#041944] p-4 sm:p-5">
      <div className="border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-2xl tracking-tight sm:text-3xl">{name}</h2>
          <span className={`rounded border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${CATEGORY_BADGE[category]}`}>
            {category}
          </span>
        </div>
        <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-white/65">{description}</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{m.label}</dt>
            <dd className={`mt-1 font-mono text-sm tabular-nums ${m.tone}`}>{m.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex gap-1.5 overflow-x-auto border-b border-white/10 pb-2.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded border px-3 py-1 text-xs font-medium transition-colors ${
              tab === t.id ? "border-sky-400/40 bg-sky-500/15 text-sky-200" : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            {t.label}
            {t.id === "table" && ` (${payoffTable.length})`}
            {t.id === "legs" && ` (${legs.length})`}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "payoff" && <PayoffChart payoffTable={payoffTable} spotPrice={spotPrice} breakevens={breakevens} />}

        {tab === "table" && (
          <div className="max-h-96 overflow-auto rounded-lg border border-white/10 bg-[#031536] text-xs">
            <table className="w-full whitespace-nowrap text-left">
              <thead className="sticky top-0 border-b border-white/10 bg-[#061e4f] text-[10px] uppercase tracking-wider text-white/50">
                <tr>
                  <th className={TH}>Closing price</th>
                  {legColumns.map((k) => (
                    <th key={k} className={TH}>{k.replace(/_/g, " ")}</th>
                  ))}
                  <th className={`${TH} text-right`}>Net P&amp;L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono tabular-nums">
                {payoffTable.map((row, i) => (
                  <tr key={row.closing_price} className={i === atmIndex ? "bg-sky-500/15 text-sky-100" : "hover:bg-white/[0.03]"}>
                    <td className={TD}>
                      ₹{row.closing_price.toLocaleString("en-IN")}
                      {i === atmIndex && <span className="ml-2 font-sans text-[9px] font-semibold uppercase text-sky-300">ATM</span>}
                    </td>
                    {legColumns.map((k) => (
                      <td key={k} className={`${TD} text-white/70`}>₹{row[k]}</td>
                    ))}
                    <td className={`${TD} text-right font-semibold ${row.net_pl > 0 ? "text-emerald-400" : row.net_pl < 0 ? "text-rose-400" : "text-white/70"}`}>
                      {row.net_pl > 0 && "+"}
                      {inr(row.net_pl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "legs" && (
          <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#031536] text-xs">
            <table className="w-full whitespace-nowrap text-left">
              <thead className="border-b border-white/10 bg-[#061e4f] text-[10px] uppercase tracking-wider text-white/50">
                <tr>
                  <th className={TH}>Leg</th>
                  <th className={TH}>Action</th>
                  <th className={TH}>Strike</th>
                  <th className={TH}>Premium</th>
                  <th className={TH}>Instrument</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono tabular-nums">
                {legs.map((leg) => (
                  <tr key={leg.label} className="hover:bg-white/[0.03]">
                    <td className={`${TD} font-sans capitalize text-white`}>{leg.label}</td>
                    <td className={`${TD} font-sans font-semibold uppercase ${leg.action === "Buy" ? "text-emerald-300" : "text-amber-300"}`}>
                      {leg.action}
                      {leg.qty > 1 && ` ×${leg.qty}`}
                    </td>
                    <td className={TD}>₹{leg.strike.toLocaleString("en-IN")}</td>
                    <td className={TD}>{leg.premium === undefined ? "—" : `₹${leg.premium}`}</td>
                    <td className={`${TD} text-[11px] text-white/40`}>{leg.instrumentKey ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
