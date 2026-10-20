"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { calculateBearCallSpread } from "@/strategies/BearCallSpread";
import { calculateBearPutSpread } from "@/strategies/BearPutSpread";
import { calculateBullCallSpread } from "@/strategies/BullCallSpread";
import { calculateBullPutSpread } from "@/strategies/BullPutSpread";
import { calculateCallButterfly } from "@/strategies/CallButterfly";
import { calculateCallCondor } from "@/strategies/CallCondor";
import { calculateLongStraddle } from "@/strategies/LongStraddle";
import { calculateLongStrangle } from "@/strategies/LongStrangle";
import { calculatePutButterfly } from "@/strategies/PutButterfly";
import { calculatePutCondor } from "@/strategies/PutCondor";
import { calculateShortStraddle } from "@/strategies/ShortStraddle";
import { calculateShortStrangle } from "@/strategies/ShortStrangle";
import {
  applyView,
  evaluate,
  type Calculator,
  type Company,
  type Evaluation,
  type LiveRow,
  type SortKey,
  type View,
} from "@/lib/derivativesBoard";
import { STRATEGY_DEFINITIONS } from "./types";

const CALCULATORS: Record<string, Calculator> = {
  long_straddle: calculateLongStraddle,
  short_straddle: calculateShortStraddle,
  long_strangle: calculateLongStrangle,
  short_strangle: calculateShortStrangle,
  bull_call_spread: calculateBullCallSpread,
  bull_put_spread: calculateBullPutSpread,
  bear_call_spread: calculateBearCallSpread,
  bear_put_spread: calculateBearPutSpread,
  call_butterfly: calculateCallButterfly,
  put_butterfly: calculatePutButterfly,
  call_condor: calculateCallCondor,
  put_condor: calculatePutCondor,
};

type Feed = { rows: Map<string, LiveRow>; live: boolean; status: string; now: number };
type Conn = "connecting" | "open" | "reconnecting";

const rupees = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const money = (n: number | null, unlimited: string) => (n == null ? unlimited : rupees(n));

// Remounting on value change replays the CSS flash, so changed cells light up briefly.
const Flash = ({ v, children }: { v: unknown; children: React.ReactNode }) => (
  <span key={String(v)} className="tick-flash">
    {children}
  </span>
);

const COLUMNS: { key: SortKey; label: string; right?: boolean }[] = [
  { key: "symbol", label: "Company" },
  { key: "maxProfit", label: "Max profit / lot", right: true },
  { key: "maxLoss", label: "Max loss / lot", right: true },
  { key: "investment", label: "Investment", right: true },
  { key: "roi", label: "Profit ÷ risk", right: true },
  { key: "beDistancePct", label: "Breakeven away", right: true },
];

export default function DerivativesBoard({ onAnalyze }: { onAnalyze: (symbol: string) => void }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [feed, setFeed] = useState<Feed | null>(null);
  const [conn, setConn] = useState<Conn>("connecting");
  const [error, setError] = useState<string | null>(null);

  const [strategy, setStrategy] = useState("long_straddle");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [view, setView] = useState<View>({
    investment: "all",
    min: null,
    max: null,
    hideStale: true,
    search: "",
    sort: "roi",
    dir: "desc",
  });

  // Relay connection. The token lasts 60s, so every (re)connect fetches a fresh one.
  useEffect(() => {
    let es: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout>;
    let dead = false;

    async function connect() {
      try {
        const res = await fetch("/api/derivatives/token");
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Could not get a live-feed token");
        if (dead) return;
        setError(null);
        es = new EventSource(`${body.url}/stream?token=${encodeURIComponent(body.token)}`);
        es.addEventListener("universe", (e) => setCompanies(JSON.parse((e as MessageEvent).data)));
        es.addEventListener("tick", (e) => {
          const t = JSON.parse((e as MessageEvent).data) as { rows: LiveRow[]; live: boolean; status: string; now: number };
          setConn("open");
          setFeed((prev) => {
            const rows = new Map(prev?.rows);
            for (const r of t.rows) rows.set(r.k, r);
            return { rows, live: t.live, status: t.status, now: t.now };
          });
        });
        es.onerror = () => {
          es?.close();
          setConn("reconnecting");
          timer = setTimeout(connect, 3000);
        };
      } catch (err) {
        if (dead) return;
        setError(err instanceof Error ? err.message : String(err));
        timer = setTimeout(connect, 5000);
      }
    }

    connect();
    return () => {
      dead = true;
      es?.close();
      clearTimeout(timer);
    };
  }, []);

  const marketOpen = feed?.status === "NORMAL_OPEN";

  const { evaluations, unavailable } = useMemo(() => {
    const evaluations: Evaluation[] = [];
    let unavailable = 0;
    if (!feed) return { evaluations, unavailable };
    for (const company of companies) {
      const row = feed.rows.get(company.k);
      if (!row) continue;
      const e = evaluate(strategy, CALCULATORS[strategy], company, row, { now: feed.now, marketOpen });
      if (e) evaluations.push(e);
      else unavailable++;
    }
    return { evaluations, unavailable };
  }, [companies, feed, strategy, marketOpen]);

  const visible = useMemo(() => applyView(evaluations, view), [evaluations, view]);

  const patch = (p: Partial<View>) => setView((v) => ({ ...v, ...p }));
  const sortBy = (key: SortKey) =>
    setView((v) => ({ ...v, sort: key, dir: v.sort === key && v.dir === "desc" ? "asc" : "desc" }));
  const toggle = (k: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (!next.delete(k)) next.add(k);
      return next;
    });
  const parseRupees = (s: string) => (s.trim() === "" || Number.isNaN(Number(s)) ? null : Number(s));

  const state = error
    ? { text: error, tone: "text-rose-300" }
    : conn === "reconnecting"
      ? { text: "Reconnecting…", tone: "text-amber-300" }
      : !feed
        ? { text: "Connecting…", tone: "text-white/50" }
        : !feed.live
          ? { text: "Upstox feed down, retrying", tone: "text-amber-300" }
          : !marketOpen
            ? { text: `Market ${feed.status.toLowerCase().replace(/_/g, " ")} · showing last prices`, tone: "text-amber-300" }
            : { text: "Live", tone: "text-emerald-300" };

  const input = "rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-sky-400 focus:outline-none";

  return (
    <div className="rounded-xl border border-white/12 bg-white/[0.04] p-4 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <h2 className="font-serif text-xl tracking-tight text-white">All Derivatives</h2>
        <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${state.tone}`}>
          <span className="size-1.5 rounded-full bg-current" />
          {state.text}
        </span>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          className={`${input} cursor-pointer`}
          aria-label="Select Strategy"
        >
          {Object.keys(CALCULATORS).map((k) => (
            <option key={k} value={k} className="bg-[#06183d] text-white">
              {STRATEGY_DEFINITIONS[k]?.name ?? k}
            </option>
          ))}
        </select>
        <input
          value={view.search}
          onChange={(e) => patch({ search: e.target.value })}
          placeholder="Search symbol"
          aria-label="Search symbol"
          className={`${input} w-36`}
        />
        <div className="flex overflow-hidden rounded-md border border-white/15 text-xs bg-white/5" role="group" aria-label="Investment Filter">
          {(["all", "low", "high"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => patch({ investment: v })}
              className={`px-2.5 py-1.5 capitalize transition-colors cursor-pointer ${
                view.investment === v ? "bg-sky-500/30 text-white font-semibold" : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {v === "all" ? "All" : `${v} investment`}
            </button>
          ))}
        </div>
        <input
          inputMode="numeric"
          placeholder="Min ₹"
          aria-label="Minimum investment in rupees"
          onChange={(e) => patch({ min: parseRupees(e.target.value) })}
          className={`${input} w-24`}
        />
        <input
          inputMode="numeric"
          placeholder="Max ₹"
          aria-label="Maximum investment in rupees"
          onChange={(e) => patch({ max: parseRupees(e.target.value) })}
          className={`${input} w-24`}
        />
        <label className="flex items-center gap-1.5 text-xs text-white/70 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={view.hideStale}
            onChange={(e) => patch({ hideStale: e.target.checked })}
            className="rounded border-white/20 bg-white/5 accent-sky-500"
          />
          Hide stale
        </label>
        <span className="ml-auto font-mono text-[11px] text-white/45">
          {visible.length} shown{unavailable ? ` · ${unavailable} n/a` : ""}
        </span>
      </div>
      <p className="mt-2 text-[11px] text-white/40">
        Investment = max loss per lot (capital at risk). Unlimited-risk strategies have no investment figure. P&amp;L assumes entry at current last traded prices.
      </p>

      <div className="mt-4 -mx-4 overflow-x-auto sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="w-full min-w-[56rem] text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/45">
                {COLUMNS.map((c) => (
                  <th key={c.key} className={`px-3 py-2.5 font-semibold ${c.right ? "text-right" : ""}`}>
                    <button type="button" onClick={() => sortBy(c.key)} className="uppercase hover:text-white cursor-pointer transition-colors">
                      {c.label}
                      {view.sort === c.key ? (view.dir === "asc" ? " ▲" : " ▼") : ""}
                    </button>
                  </th>
                ))}
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => (
                <Fragment key={e.k}>
                  <tr
                    onClick={() => toggle(e.k)}
                    className={`cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.04] ${e.stale ? "opacity-45" : ""}`}
                  >
                    <td className="px-3 py-2">
                      <div className="font-mono text-[13px] font-bold text-sky-300">{e.symbol}</div>
                      <div className="font-mono text-[10px] text-white/40">
                        {e.expiry} · lot {e.lot} · <Flash v={e.spot}>{e.spot}</Flash>
                        {e.stale && <span className="ml-1 text-amber-300">stale · {e.stale}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-300">
                      <Flash v={e.maxProfit}>{money(e.maxProfit, "Unlimited")}</Flash>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-rose-300">
                      <Flash v={e.maxLoss}>{money(e.maxLoss, "Unlimited")}</Flash>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      <Flash v={e.investment}>{money(e.investment, "—")}</Flash>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{e.roi == null ? "—" : `${e.roi.toFixed(2)}×`}</td>
                    <td className="px-3 py-2 text-right font-mono text-white/70">
                      {e.beDistancePct == null ? "—" : `${e.beDistancePct.toFixed(1)}%`}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onAnalyze(e.symbol);
                        }}
                        className="rounded border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
                      >
                        Analyze
                      </button>
                    </td>
                  </tr>
                  {expanded.has(e.k) && (
                    <tr className="border-b border-white/5 bg-black/25">
                      <td colSpan={COLUMNS.length + 1} className="px-4 py-3.5">
                        <PayoffTable e={e} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!visible.length && (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="py-10 text-center font-mono text-xs text-white/40">
                    {feed ? "NO MATCHING COMPANIES" : "WAITING FOR LIVE PRICES"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PayoffTable({ e }: { e: Evaluation }) {
  if (!e.payoff.length) return <p className="text-xs text-white/50">No payoff table available.</p>;
  const cols = Object.keys(e.payoff[0]);
  const nearest = e.payoff.reduce(
    (best, r, i) => (Math.abs(Number(r.closing_price) - e.spot) < Math.abs(Number(e.payoff[best].closing_price) - e.spot) ? i : best),
    0,
  );
  return (
    <div className="overflow-x-auto">
      <p className="mb-1.5 text-[10px] uppercase tracking-wider text-white/40">
        Payoff at expiry · per share, last column per lot · hypothetical entry at current prices
      </p>
      <table className="w-full text-right font-mono text-[11px]">
        <thead className="text-white/45">
          <tr>
            {cols.map((c) => (
              <th key={c} className="px-2 py-1 font-medium capitalize">
                {c.replace(/_/g, " ")}
              </th>
            ))}
            <th className="px-2 py-1 font-medium">net P&amp;L / lot</th>
          </tr>
        </thead>
        <tbody>
          {e.payoff.map((r, i) => {
            const net = Number(r.net_pl) * e.lot;
            return (
              <tr key={String(r.closing_price)} className={i === nearest ? "bg-sky-500/15" : ""}>
                {cols.map((c) => (
                  <td key={c} className={`px-2 py-0.5 ${c === "net_pl" ? (Number(r[c]) >= 0 ? "text-emerald-300" : "text-rose-300") : ""}`}>
                    <Flash v={r[c]}>{String(r[c])}</Flash>
                  </td>
                ))}
                <td className={`px-2 py-0.5 ${net >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{rupees(net)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
