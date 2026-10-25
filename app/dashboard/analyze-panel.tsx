"use client";

import { ChartLineUpIcon, WarningIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/app/components/app-shell";
import type { ShellUser } from "@/app/components/avatar-menu";
import { Spinner } from "@/app/components/spinner";
import { cn } from "@/lib/utils";
import DerivativesBoard from "./derivatives-board";
import { HistorySheet, type Snapshot } from "./history-sheet";
import StrategyExplorer from "./strategy-explorer";
import { QUICK, SymbolSearch, symbolName } from "./symbol-search";

function PendingState({ symbol }: { symbol: string }) {
  return (
    <div role="status" aria-label={`Pricing strategies for ${symbol}`} className="flex flex-col gap-4">
      <div className="flex items-end gap-8 px-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-16 rounded-xl" />
      <Card className="gap-4 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
        <Skeleton className="h-[360px] rounded-xl" />
      </Card>
    </div>
  );
}

export default function AnalyzePanel({ history, user }: { history: Snapshot[]; user: ShellUser }) {
  const router = useRouter();
  const params = useSearchParams();
  const [company, setCompany] = useState("");
  const [active, setActive] = useState<Snapshot | null>(history[0] ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showBoard, setShowBoard] = useState(params.get("view") === "derivatives");
  const [historyOpen, setHistoryOpen] = useState(params.get("history") === "open");

  async function analyze(target: string) {
    target = target.trim();
    if (!target) return;
    setShowBoard(false);
    setHistoryOpen(false);
    setCompany(target);
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: target }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");
      const { id, ...result } = data;
      setActive({ id, company: target, result });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  const rail = (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          analyze(company);
        }}
        className="flex flex-col gap-2"
      >
        <SymbolSearch value={company} onChange={setCompany} onSelect={analyze} disabled={pending} />
        <Button type="submit" size="lg" disabled={pending} className="w-full font-semibold">
          {pending && <Spinner />}
          {pending ? "Calculating…" : "Analyze"}
        </Button>
      </form>
      <div className="flex flex-col gap-1">
        <span className="px-2 pb-1 text-xs text-muted-foreground">Quick symbols</span>
        <div className="flex flex-wrap gap-1 lg:flex-col">
          {QUICK.map((sym) => {
            const current = !showBoard && active?.company.toUpperCase() === sym;
            return (
              <button
                key={sym}
                type="button"
                disabled={pending}
                onClick={() => analyze(sym)}
                aria-current={current || undefined}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 max-lg:bg-muted",
                  current && "bg-accent",
                )}
              >
                <span className="font-medium">{sym}</span>
                <span className="truncate text-xs text-muted-foreground max-lg:hidden">{symbolName(sym)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <AppShell
      active={showBoard ? "derivatives" : "terminal"}
      user={user}
      rail={rail}
      historyCount={history.length}
      onOpenHistory={() => setHistoryOpen(true)}
      onNavigate={(view) => setShowBoard(view === "derivatives")}
    >
      <div className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive" className="px-4 py-3">
            <WarningIcon />
            <AlertTitle>Analysis failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Strict Mutual Exclusivity: Live Market vs Analyze */}
        {showBoard ? (
          <DerivativesBoard onAnalyze={analyze} />
        ) : pending ? (
          <PendingState symbol={company} />
        ) : active ? (
          <StrategyExplorer
            key={active.id ?? "latest"}
            data={active.result}
            company={active.company}
            analysisId={active.id}
            decision={active.decision}
          />
        ) : (
          <Empty className="min-h-[480px] rounded-xl bg-card ring-1 ring-foreground/10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ChartLineUpIcon />
              </EmptyMedia>
              <EmptyTitle className="text-xl">No option chain loaded</EmptyTitle>
              <EmptyDescription>Search an index or stock symbol to price all 12 strategies and their payoffs.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row flex-wrap justify-center">
              {QUICK.map((sym) => (
                <Button key={sym} variant="outline" onClick={() => analyze(sym)}>
                  {sym}
                </Button>
              ))}
            </EmptyContent>
          </Empty>
        )}
      </div>

      <HistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        history={history}
        activeId={active?.id}
        onPick={(item) => {
          setActive(item);
          setShowBoard(false);
          setHistoryOpen(false);
        }}
      />
    </AppShell>
  );
}
