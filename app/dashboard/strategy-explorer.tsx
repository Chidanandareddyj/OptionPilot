"use client";

import { CodeIcon, CopyIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { parseStoredDecision, type Pane } from "@/lib/analysis";
import { cn } from "@/lib/utils";
import RecommendationPanel, { type Decision } from "./recommendation-panel";
import StrategyDetail from "./strategy-detail";
import StrategyRow, { STRATEGY_COLUMNS } from "./strategy-row";
import { normalizeStrategy, STRATEGY_DEFINITIONS, type Category, type NormalizedStrategy } from "./types";

const FILTERS: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "bullish", label: "Bullish" },
  { id: "bearish", label: "Bearish" },
  { id: "neutral", label: "Neutral" },
  { id: "volatile", label: "Volatile" },
];

const CHIP =
  "h-9 gap-2 rounded-full px-3 text-sm data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

type Payload = {
  underlying_key?: string;
  expiry_date?: string;
  underlying_spot_price?: number;
  [key: string]: unknown;
};

function asDecision(value: unknown): Decision | null {
  if (!value || typeof value !== "object") return null;
  return Array.isArray((value as Decision).strategies) ? (value as Decision) : null;
}

function lotOf(value: unknown) {
  if (!value || typeof value !== "object") return 0;
  const n = (value as { lot_size?: unknown }).lot_size;
  return typeof n === "number" && n > 0 ? n : 0;
}

function ComparePane({
  pane,
  decision,
  strategy,
  focused,
  onFocus,
}: {
  pane: Pane;
  decision: Decision | null;
  strategy: NormalizedStrategy | null;
  focused: boolean;
  onFocus: () => void;
}) {
  return (
    <div
      onClick={onFocus}
      className={cn(
        "flex min-w-0 cursor-pointer flex-col gap-2 rounded-2xl p-1 transition-opacity",
        focused ? "ring-2 ring-primary" : "opacity-85 hover:opacity-100",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-2 pt-1">
        <span className="text-sm font-medium capitalize">
          {pane} pane{decision?.view && <span className="text-muted-foreground"> · {decision.view} view</span>}
        </span>
        {focused && <Badge className="h-6 rounded-md px-2">Active target</Badge>}
      </div>
      {strategy ? (
        <StrategyDetail strategy={strategy} />
      ) : (
        <Empty className="rounded-xl bg-card ring-1 ring-foreground/10">
          <EmptyHeader>
            <EmptyTitle>Nothing to compare yet</EmptyTitle>
            <EmptyDescription>Score the {pane} view above to compare.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}

export default function StrategyExplorer({
  data: result,
  company,
  analysisId,
  decision: savedDecision,
}: {
  data: unknown;
  company: string;
  analysisId?: string;
  decision?: unknown;
}) {
  const data = (result ?? {}) as Payload;
  const stored = parseStoredDecision(savedDecision);
  const [compareMode, setCompareMode] = useState(stored.mode === "compare");
  const [single, setSingle] = useState<Decision | null>(stored.mode === "single" ? asDecision(stored.single) : null);
  const [left, setLeft] = useState<Decision | null>(
    stored.mode === "compare" ? asDecision(stored.left) : (stored.mode === "single" ? asDecision(stored.single) : null)
  );
  const [right, setRight] = useState<Decision | null>(stored.mode === "compare" ? asDecision(stored.right) : null);
  const [focusPane, setFocusPane] = useState<Pane>("left");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedByPane, setSelectedByPane] = useState<{ left: string | null; right: string | null }>({
    left: stored.mode === "compare" ? (asDecision(stored.left)?.best?.key ?? null) : (stored.mode === "single" ? (asDecision(stored.single)?.best?.key ?? null) : null),
    right: stored.mode === "compare" ? (asDecision(stored.right)?.best?.key ?? null) : null,
  });
  const [filter, setFilter] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [showJson, setShowJson] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const compareDetailRef = useRef<HTMLDivElement>(null);

  const rankedDecision = compareMode ? (focusPane === "left" ? left : right) : single;
  const spot = data.underlying_spot_price ?? 0;
  const lotSize = lotOf(data) || lotOf(rankedDecision) || lotOf(single) || lotOf(left) || lotOf(right) || 1;
  const strategies = Object.keys(STRATEGY_DEFINITIONS).flatMap((key) => normalizeStrategy(key, data[key], spot, lotSize) ?? []);
  const pick = (key: string | null) => strategies.find((s) => s.key === key) ?? null;
  const active = pick(selectedKey) ?? strategies[0];
  const leftActive = pick(selectedByPane.left) ?? (strategies.length > 0 ? strategies[0] : null);
  const rightActive = pick(selectedByPane.right) ?? (strategies.length > 1 ? strategies[1] : strategies[0] ?? null);
  const ranked = new Map(rankedDecision?.strategies.map((s, i) => [s.key, { ...s, rank: i + 1 }]));
  const visible = strategies
    .filter(
      (s) =>
        (filter === "all" || s.category === filter) &&
        `${s.name} ${s.tagline}`.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => (ranked.get(a.key)?.rank ?? 99) - (ranked.get(b.key)?.rank ?? 99));
  const handleCompareMode = (on: boolean) => {
    setCompareMode(on);
    if (on && single && !left) {
      setLeft(single);
      setSelectedByPane((prev) => ({
        ...prev,
        left: prev.left ?? single.best?.key ?? (strategies.length > 0 ? strategies[0].key : null),
      }));
    }
  };

  const select = (key: string, pane?: Pane) => {
    if (compareMode) {
      const target = pane ?? focusPane;
      setFocusPane(target);
      setSelectedByPane((prev) => ({ ...prev, [target]: key }));
      compareDetailRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setSelectedKey(key);
    detailRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const onPane = (pane: Pane, decision: Decision) => {
    if (pane === "left") {
      setLeft(decision);
      if (!right && single) setRight(single);
    } else {
      setRight(decision);
      if (!left && single) setLeft(single);
    }
    setSelectedByPane((prev) => {
      const next = { ...prev, [pane]: decision.best?.key ?? prev[pane] ?? null };
      const other = pane === "left" ? "right" : "left";
      if (!next[other] && single?.best?.key) next[other] = single.best.key;
      return next;
    });
  };
  const instrumentId = data.underlying_key?.replace(/^NSE_(INDEX|EQ)\|/, "") || "";
  const companySymbol = company.toUpperCase().trim();
  const companyFullName = (typeof data.company_name === "string" ? data.company_name : "").trim();
  const atmStrike =
    (data.atm_strike as number | undefined) ??
    (data.long_straddle as { strike_price?: number } | undefined)?.strike_price ??
    (data.short_straddle as { strike_price?: number } | undefined)?.strike_price;
  const gridSelectedKey = compareMode ? selectedByPane[focusPane] : active?.key;
  const subtitle = [companyFullName !== companySymbol && companyFullName, instrumentId !== companySymbol && instrumentId]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end gap-x-8 gap-y-4 px-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs text-muted-foreground">NSE F&amp;O · option chain</span>
          <h1 className="text-4xl font-semibold tracking-tight">{companySymbol}</h1>
          {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
        </div>
        {spot > 0 && (
          <div className="flex flex-col gap-1 pb-1">
            <span className="text-xs text-muted-foreground">Spot</span>
            <span className="num text-3xl font-medium">₹{spot.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 pb-1 xl:ml-auto">
          {atmStrike != null && (
            <Badge variant="outline" className="num h-9 rounded-lg px-3 text-sm font-normal">
              ATM {Number(atmStrike).toLocaleString("en-IN")}
            </Badge>
          )}
          {data.expiry_date && (
            <Badge variant="outline" className="num h-9 rounded-lg px-3 text-sm font-normal">
              Expiry {data.expiry_date}
            </Badge>
          )}
          {lotSize > 1 && (
            <Badge variant="outline" className="num h-9 rounded-lg px-3 text-sm font-normal">
              Lot {lotSize.toLocaleString("en-IN")}
            </Badge>
          )}
          <Button variant="outline" size="lg" aria-expanded={showJson} onClick={() => setShowJson(!showJson)}>
            <CodeIcon />
            {showJson ? "Hide JSON" : "Raw JSON"}
          </Button>
        </div>
      </header>

      {showJson && (
        <Card size="sm" className="gap-2 px-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Calculator response</span>
            <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}>
              <CopyIcon />
              Copy
            </Button>
          </div>
          <pre className="num max-h-64 overflow-auto rounded-lg bg-background p-3 text-xs leading-relaxed text-muted-foreground">
            {JSON.stringify(data, null, 2)}
          </pre>
        </Card>
      )}

      <RecommendationPanel
        analysisId={analysisId}
        compareMode={compareMode}
        onCompareMode={handleCompareMode}
        single={single}
        left={left}
        right={right}
        onSingle={setSingle}
        onPane={onPane}
        onSelect={select}
      />

      {compareMode ? (
        <div ref={compareDetailRef} className="grid scroll-mt-20 grid-cols-1 gap-4 xl:grid-cols-2">
          <ComparePane pane="left" decision={left} strategy={leftActive} focused={focusPane === "left"} onFocus={() => setFocusPane("left")} />
          <ComparePane pane="right" decision={right} strategy={rightActive} focused={focusPane === "right"} onFocus={() => setFocusPane("right")} />
        </div>
      ) : (
        active && (
          <div ref={detailRef} className="scroll-mt-20">
            <StrategyDetail strategy={active} />
          </div>
        )
      )}

      <Card className="gap-4 p-6">
        <CardHeader className="flex flex-row flex-wrap items-end gap-4 p-0">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl font-semibold">Compare all {strategies.length} strategies</CardTitle>
            <CardDescription>
              {rankedDecision ? "Ranked by recommendation score." : "In catalogue order."} Select a row to load its payoff.
            </CardDescription>
          </div>
          <div className="relative w-full sm:ml-auto sm:w-56">
            <MagnifyingGlassIcon aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search strategy"
              aria-label="Search strategy"
              className="h-9 bg-muted pl-8"
            />
          </div>
        </CardHeader>

        <div className="flex flex-wrap items-center gap-4">
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(v) => v && setFilter(v as Category | "all")}
            variant="outline"
            spacing={2}
            aria-label="Filter by market view"
            className="flex-wrap justify-start"
          >
            {FILTERS.map((f) => (
              <ToggleGroupItem key={f.id} value={f.id} className={CHIP}>
                {f.label}
                <span className="num text-xs opacity-80">
                  {f.id === "all" ? strategies.length : strategies.filter((s) => s.category === f.id).length}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {compareMode && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground md:ml-auto">
              Rows apply to
              <ToggleGroup
                type="single"
                value={focusPane}
                onValueChange={(v) => v && setFocusPane(v as Pane)}
                variant="outline"
                spacing={2}
                aria-label="Pane that rows load into"
              >
                {(["left", "right"] as const).map((pane) => (
                  <ToggleGroupItem key={pane} value={pane} className={cn(CHIP, "capitalize")}>
                    {pane}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}
        </div>

        <CardContent className="p-0">
          {visible.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {STRATEGY_COLUMNS.map((c) => (
                    <TableHead key={c.label} className={cn("px-3 py-3 text-sm", "numeric" in c && "text-right")}>
                      {c.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((s) => (
                  <StrategyRow
                    key={s.key}
                    strategy={s}
                    index={strategies.indexOf(s)}
                    selected={gridSelectedKey === s.key}
                    decision={ranked.get(s.key)}
                    recommended={rankedDecision?.best?.key === s.key}
                    onSelect={() => select(s.key)}
                  />
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyTitle>No matching strategies</EmptyTitle>
                <EmptyDescription>
                  {strategies.length === 0 ? "The calculator returned no strategies for this symbol." : "Try another view or clear the search."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
