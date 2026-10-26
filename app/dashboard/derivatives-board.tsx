"use client";

import { CaretDownIcon, CaretRightIcon, ClockIcon, EyeSlashIcon, MagnifyingGlassIcon, WarningIcon } from "@phosphor-icons/react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import { signedInr } from "@/lib/payoff-series";
import { cn } from "@/lib/utils";
import { Spinner } from "@/app/components/spinner";
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
  <span key={String(v)} className="animate-tick-flash rounded-sm motion-reduce:animate-none">
    {children}
  </span>
);

const COLUMNS: { key: SortKey; label: string; right?: boolean }[] = [
  { key: "symbol", label: "Company" },
  { key: "maxProfit", label: "Max profit per lot", right: true },
  { key: "maxLoss", label: "Max loss per lot", right: true },
  { key: "investment", label: "Investment", right: true },
  { key: "roi", label: "Profit to risk", right: true },
  { key: "beDistancePct", label: "Breakeven away", right: true },
];

const CHIP = "h-9 rounded-full px-4 text-sm data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

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
          if (typeof window !== "undefined" && t.status) {
            window.dispatchEvent(new CustomEvent("market-status", { detail: t.status }));
          }
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
  const staleCount = useMemo(
    () => applyView(evaluations, { ...view, hideStale: false }).filter((e) => e.stale).length,
    [evaluations, view],
  );

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

  const status =
    conn === "reconnecting" ? "Reconnecting…" : !feed ? "Connecting…" : !feed.live && marketOpen ? "Syncing…" : null;

  const count = `Showing ${visible.length} of ${evaluations.length} contracts${unavailable ? `, ${unavailable} unavailable` : ""}`;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end gap-4 px-2">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Screener</span>
          <h1 className="text-4xl font-semibold tracking-tight">All derivatives</h1>
        </div>
        {status && !error && (
          <Badge variant="outline" className="ml-auto h-9 gap-2 rounded-lg px-3 text-sm font-normal">
            <Spinner />
            {status}
          </Badge>
        )}
      </header>

      {error && (
        <Alert variant="destructive" className="flex items-center gap-4 px-4 py-3">
          <WarningIcon className="size-6 shrink-0" />
          <div className="flex flex-col">
            <AlertTitle className="text-base font-semibold">Live feed unavailable</AlertTitle>
            <AlertDescription>{error} Retrying automatically.</AlertDescription>
          </div>
        </Alert>
      )}

      {feed && !marketOpen && (
        <Alert className="flex items-center gap-4 px-4 py-3">
          <ClockIcon className="size-6 shrink-0 text-muted-foreground" />
          <div className="flex flex-col">
            <AlertTitle className="text-base font-semibold">Market closed. Showing last close.</AlertTitle>
            <AlertDescription>Prices are the last traded values. They refresh when NSE opens.</AlertDescription>
          </div>
          <Badge variant="outline" className="ml-auto h-9 gap-2 rounded-lg px-3 text-sm font-normal max-md:hidden">
            <span aria-hidden className="size-2 rounded-full bg-muted-foreground" />
            Opens weekdays 9:15 am IST
          </Badge>
        </Alert>
      )}

      <div className="flex flex-wrap items-end gap-4 px-2">
        <div className="flex flex-col gap-2">
          <Label className="text-sm text-muted-foreground">Strategy</Label>
          <Select value={strategy} onValueChange={setStrategy}>
            <SelectTrigger className="h-9 w-48 bg-muted" aria-label="Strategy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(CALCULATORS).map((k) => (
                <SelectItem key={k} value={k}>
                  {STRATEGY_DEFINITIONS[k]?.name ?? k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="derivatives-symbol" className="text-sm text-muted-foreground">
            Symbol
          </Label>
          <div className="relative">
            <MagnifyingGlassIcon aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="derivatives-symbol"
              value={view.search}
              onChange={(e) => patch({ search: e.target.value })}
              placeholder="Search symbol"
              className="h-9 w-48 bg-muted pl-8"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-sm text-muted-foreground">Investment</Label>
          <ToggleGroup
            type="single"
            value={view.investment}
            onValueChange={(v) => v && patch({ investment: v as View["investment"] })}
            variant="outline"
            spacing={2}
            aria-label="Investment"
          >
            {(["all", "low", "high"] as const).map((v) => (
              <ToggleGroupItem key={v} value={v} className={cn(CHIP, "capitalize")}>
                {v}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="derivatives-min" className="text-sm text-muted-foreground">
            Min
          </Label>
          <Input
            id="derivatives-min"
            inputMode="numeric"
            placeholder="₹ 0"
            onChange={(e) => patch({ min: parseRupees(e.target.value) })}
            className="num h-9 w-28 bg-muted"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="derivatives-max" className="text-sm text-muted-foreground">
            Max
          </Label>
          <Input
            id="derivatives-max"
            inputMode="numeric"
            placeholder="₹ No limit"
            onChange={(e) => patch({ max: parseRupees(e.target.value) })}
            className="num h-9 w-28 bg-muted"
          />
        </div>
        <label className="flex h-9 items-center gap-2 text-sm text-muted-foreground lg:ml-auto">
          Show stale rows
          <Switch checked={!view.hideStale} onCheckedChange={(on) => patch({ hideStale: !on })} />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2">
        <span className="text-sm text-muted-foreground">
          {count}
          {staleCount > 0 && (view.hideStale ? `. ${staleCount} stale rows are hidden.` : `, ${staleCount} stale rows shown faded.`)}
        </span>
        <span className="text-sm text-faint lg:ml-auto">
          Investment is max loss per lot. Unlimited risk strategies have no investment figure. P&amp;L assumes entry at last traded prices.
        </span>
      </div>

      <Card className="gap-0 p-2">
        <Table className="min-w-[56rem]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {COLUMNS.map((c) => (
                <TableHead
                  key={c.key}
                  aria-sort={view.sort === c.key ? (view.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={cn("px-4 py-3 text-sm", c.right && "text-right")}
                >
                  <button
                    type="button"
                    onClick={() => sortBy(c.key)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                      view.sort === c.key ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {c.label}
                    {view.sort === c.key && <span aria-hidden>{view.dir === "asc" ? "↑" : "↓"}</span>}
                  </button>
                </TableHead>
              ))}
              <TableHead className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((e) => {
              const open = expanded.has(e.k);
              return (
                <Fragment key={e.k}>
                  <TableRow onClick={() => toggle(e.k)} className={cn("h-16 cursor-pointer", e.stale && "opacity-70")}>
                    <TableCell className="px-4">
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-label={`${open ? "Hide" : "Show"} payoff table for ${e.symbol}`}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            toggle(e.k);
                          }}
                          className="mt-0.5 rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {open ? <CaretDownIcon className="size-4" /> : <CaretRightIcon className="size-4" />}
                        </button>
                        <div className="flex flex-col">
                          <span className="flex items-center gap-2 text-sm font-medium">
                            {e.symbol}
                            {e.stale && (
                              <Badge variant="outline" className="h-5 rounded px-2 text-xs font-normal text-muted-foreground" title={`No recent trade in ${e.stale}`}>
                                Stale · {e.stale}
                              </Badge>
                            )}
                          </span>
                          <span className="num text-xs text-muted-foreground">
                            {e.expiry} · lot {e.lot} · <Flash v={e.spot}>{e.spot}</Flash>
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="num px-4 text-right text-sm text-profit">
                      <Flash v={e.maxProfit}>{e.maxProfit == null ? "Unlimited" : `+${rupees(e.maxProfit)}`}</Flash>
                    </TableCell>
                    <TableCell className="num px-4 text-right text-sm text-loss">
                      <Flash v={e.maxLoss}>{e.maxLoss == null ? "Unlimited" : `\u2212${rupees(Math.abs(e.maxLoss))}`}</Flash>
                    </TableCell>
                    <TableCell className="num px-4 text-right text-sm">
                      <Flash v={e.investment}>{money(e.investment, "—")}</Flash>
                    </TableCell>
                    <TableCell className="num px-4 text-right text-sm">{e.roi == null ? "—" : `${e.roi.toFixed(2)}×`}</TableCell>
                    <TableCell className="num px-4 text-right text-sm">{e.beDistancePct == null ? "—" : `${e.beDistancePct.toFixed(1)}%`}</TableCell>
                    <TableCell className="px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onAnalyze(e.symbol);
                        }}
                      >
                        Analyze
                      </Button>
                    </TableCell>
                  </TableRow>
                  {open && (
                    <TableRow className="bg-background hover:bg-background">
                      <TableCell colSpan={COLUMNS.length + 1} className="px-4 py-4">
                        <PayoffTable e={e} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
            {!visible.length && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={COLUMNS.length + 1} className="py-12 text-center text-sm text-muted-foreground">
                  {feed ? "No matching companies." : "Waiting for prices…"}
                </TableCell>
              </TableRow>
            )}
            {view.hideStale && staleCount > 0 && (
              <TableRow className="h-14 hover:bg-transparent">
                <TableCell colSpan={COLUMNS.length + 1} className="px-4">
                  <div className="flex items-center gap-3">
                    <EyeSlashIcon aria-hidden className="size-5 text-faint" />
                    <span className="text-sm text-muted-foreground">
                      {staleCount} stale rows hidden. These contracts have a leg with no recent trade.
                    </span>
                    <Button variant="ghost" size="sm" className="ml-auto h-8 text-primary" onClick={() => patch({ hideStale: false })}>
                      Show stale rows
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function PayoffTable({ e }: { e: Evaluation }) {
  if (!e.payoff.length) return <p className="text-sm text-muted-foreground">No payoff table available.</p>;
  const cols = Object.keys(e.payoff[0]);
  const nearest = e.payoff.reduce(
    (best, r, i) => (Math.abs(Number(r.closing_price) - e.spot) < Math.abs(Number(e.payoff[best].closing_price) - e.spot) ? i : best),
    0,
  );
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Payoff at expiry, per share with the last column per lot. Hypothetical entry at current prices.
      </p>
      <Table className="text-right">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {cols.map((c) => (
              <TableHead key={c} className="px-2 text-right text-xs font-normal text-muted-foreground capitalize">
                {c.replace(/_/g, " ")}
              </TableHead>
            ))}
            <TableHead className="px-2 text-right text-xs font-normal text-muted-foreground">Net P&amp;L per lot</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {e.payoff.map((r, i) => {
            const net = Number(r.net_pl) * e.lot;
            return (
              <TableRow key={String(r.closing_price)} className={cn("num text-xs", i === nearest && "bg-accent hover:bg-accent")}>
                {cols.map((c) => (
                  <TableCell
                    key={c}
                    className={cn("px-2 py-1", c === "net_pl" && (Number(r[c]) >= 0 ? "text-profit" : "text-loss"))}
                  >
                    <Flash v={r[c]}>{String(r[c])}</Flash>
                  </TableCell>
                ))}
                <TableCell className={cn("px-2 py-1", net >= 0 ? "text-profit" : "text-loss")}>{signedInr(net)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
