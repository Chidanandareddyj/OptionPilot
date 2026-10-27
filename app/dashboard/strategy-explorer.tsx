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
import { MobileStrategyCard } from "./mobile-strategy-card";
import { MobileStrategySheet } from "./mobile-strategy-sheet";
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
  "h-8 gap-1.5 rounded-full px-3 text-xs md:h-9 md:gap-2 md:text-sm data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

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
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileComparePane, setMobileComparePane] = useState<Pane>("left");

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
      {/* Header: Adaptive for Mobile / Tablet / Laptop */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-1 md:px-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">NSE F&amp;O · Option Chain</span>
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{companySymbol}</h1>
            {spot > 0 && (
              <span className="num text-2xl font-semibold text-foreground md:hidden">
                ₹{spot.toLocaleString("en-IN", { minimumFractionDigits: 1 })}
              </span>
            )}
          </div>
          {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
        </div>

        {spot > 0 && (
          <div className="hidden flex-col gap-1 pb-1 md:flex">
            <span className="text-xs text-muted-foreground">Spot Price</span>
            <span className="num text-3xl font-medium">₹{spot.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 pb-1 sm:gap-2">
          {atmStrike != null && (
            <Badge variant="outline" className="num h-8 rounded-lg px-2.5 text-xs font-normal md:h-9 md:px-3 md:text-sm">
              ATM {Number(atmStrike).toLocaleString("en-IN")}
            </Badge>
          )}
          {data.expiry_date && (
            <Badge variant="outline" className="num h-8 rounded-lg px-2.5 text-xs font-normal md:h-9 md:px-3 md:text-sm">
              Expiry {data.expiry_date}
            </Badge>
          )}
          {lotSize > 1 && (
            <Badge variant="outline" className="num h-8 rounded-lg px-2.5 text-xs font-normal md:h-9 md:px-3 md:text-sm">
              Lot {lotSize.toLocaleString("en-IN")}
            </Badge>
          )}
          <Button variant="outline" size="sm" className="h-8 md:h-9" aria-expanded={showJson} onClick={() => setShowJson(!showJson)}>
            <CodeIcon />
            <span className="max-sm:hidden">{showJson ? "Hide JSON" : "Raw JSON"}</span>
            <span className="sm:hidden">JSON</span>
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

      {/* Recommendation & Scored Strategy Panel */}
      <RecommendationPanel
        analysisId={analysisId}
        compareMode={compareMode}
        onCompareMode={handleCompareMode}
        single={single}
        left={left}
        right={right}
        onSingle={setSingle}
        onPane={onPane}
        onSelect={(key, pane) => {
          select(key, pane);
          // On mobile, also trigger the detail sheet
          setMobileSheetOpen(true);
        }}
      />

      {/* ============================================================== */}
      {/* 1. MOBILE PHONE VIEW (< 768px): Card list + Bottom Payoff Sheet */}
      {/* ============================================================== */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* Compare Mode Payoff Accordion / Toggle for Mobile */}
        {compareMode && (
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
            <div className="flex rounded-lg bg-muted p-1 gap-1">
              <button
                type="button"
                onClick={() => setMobileComparePane("left")}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors",
                  mobileComparePane === "left" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                )}
              >
                Left Payoff
              </button>
              <button
                type="button"
                onClick={() => setMobileComparePane("right")}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors",
                  mobileComparePane === "right" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                )}
              >
                Right Payoff
              </button>
            </div>
            {mobileComparePane === "left" ? (
              leftActive ? (
                <StrategyDetail strategy={leftActive} />
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">Score left view to see payoff.</div>
              )
            ) : rightActive ? (
              <StrategyDetail strategy={rightActive} />
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">Score right view to see payoff.</div>
            )}
          </div>
        )}

        {/* Filter and Search Controls */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="relative w-full">
            <MagnifyingGlassIcon aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search strategy name or tagline..."
              className="h-10 bg-muted pl-9 text-sm"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  filter === f.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-accent"
                )}
              >
                <span>{f.label}</span>
                <span className="num text-[10px] opacity-80">
                  {f.id === "all" ? strategies.length : strategies.filter((s) => s.category === f.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* High-density Touch Cards List */}
        <div className="flex flex-col gap-2.5">
          {visible.length > 0 ? (
            visible.map((s) => (
              <MobileStrategyCard
                key={s.key}
                strategy={s}
                selected={gridSelectedKey === s.key}
                decision={ranked.get(s.key)}
                recommended={rankedDecision?.best?.key === s.key}
                onSelect={() => {
                  select(s.key);
                  setMobileSheetOpen(true);
                }}
              />
            ))
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground">No matching strategies found.</div>
          )}
        </div>

        {/* Full-bleed Mobile Bottom Sheet for Active Payoff Chart & Legs */}
        <MobileStrategySheet
          strategy={active}
          open={mobileSheetOpen}
          onOpenChange={setMobileSheetOpen}
        />
      </div>

      {/* ============================================================== */}
      {/* 2. TABLET VIEW (768px - 1024px): 2-Column Master-Detail Layout */}
      {/* ============================================================== */}
      <div className="hidden md:block lg:hidden">
        {compareMode ? (
          <div ref={compareDetailRef} className="grid grid-cols-2 gap-4">
            <ComparePane pane="left" decision={left} strategy={leftActive} focused={focusPane === "left"} onFocus={() => setFocusPane("left")} />
            <ComparePane pane="right" decision={right} strategy={rightActive} focused={focusPane === "right"} onFocus={() => setFocusPane("right")} />
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4 items-start">
            {/* Left Column (5 cols): Master Strategy List & Filters */}
            <div className="col-span-5 flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <MagnifyingGlassIcon aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search strategy..."
                    className="h-9 bg-muted pl-9 text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        filter === f.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-accent"
                      )}
                    >
                      {f.label} ({f.id === "all" ? strategies.length : strategies.filter((s) => s.category === f.id).length})
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Master List */}
              <div className="flex flex-col gap-2 max-h-[720px] overflow-y-auto pr-1">
                {visible.map((s) => (
                  <MobileStrategyCard
                    key={s.key}
                    strategy={s}
                    selected={gridSelectedKey === s.key}
                    decision={ranked.get(s.key)}
                    recommended={rankedDecision?.best?.key === s.key}
                    onSelect={() => select(s.key)}
                  />
                ))}
              </div>
            </div>

            {/* Right Column (7 cols): Sticky Payoff Chart, Stats & Legs */}
            <div className="col-span-7 sticky top-20">
              {active && <StrategyDetail strategy={active} />}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. LAPTOP & DESKTOP VIEW (>= 1024px): Preserved Power Layout   */}
      {/* ============================================================== */}
      <div className="hidden lg:flex lg:flex-col lg:gap-4">
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
    </div>
  );
}
