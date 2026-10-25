"use client";

import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { parseStoredDecision } from "@/lib/analysis";
import { cn } from "@/lib/utils";
import { STRATEGY_DEFINITIONS } from "./types";

export type Snapshot = {
  id?: string;
  company: string;
  createdAt?: Date;
  result: unknown;
  decision?: unknown;
};

function describe(item: Snapshot) {
  const stored = parseStoredDecision(item.decision);
  const singleDec =
    stored.mode === "single" && stored.single && typeof stored.single === "object"
      ? (stored.single as { view?: string; best?: { key?: string } | null })
      : null;
  const bestKey = singleDec?.best?.key;
  const bestName = bestKey ? (STRATEGY_DEFINITIONS[bestKey]?.name ?? bestKey) : null;
  const resObj = item.result && typeof item.result === "object" ? (item.result as Record<string, unknown>) : null;
  const spot =
    typeof resObj?.underlying_spot_price === "number"
      ? resObj.underlying_spot_price
      : typeof resObj?.spot_price === "number"
        ? resObj.spot_price
        : null;

  const createdAtDate = item.createdAt ? new Date(item.createdAt) : null;
  const formattedTime =
    createdAtDate && !isNaN(createdAtDate.getTime())
      ? createdAtDate.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const note =
    bestName && singleDec?.view ? `${singleDec.view} · ${bestName}` : stored.mode === "compare" ? "Compare view" : "12 strategies";

  return { spot, formattedTime, note };
}

export function HistorySheet({
  open,
  onOpenChange,
  history,
  activeId,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: Snapshot[];
  activeId?: string;
  onPick: (item: Snapshot) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="gap-1 p-6 pr-16">
          <SheetTitle className="text-2xl font-semibold">Analysis history</SheetTitle>
          <SheetDescription>
            {history.length} saved snapshot{history.length === 1 ? "" : "s"}. Open one to reload that analysis.
          </SheetDescription>
        </SheetHeader>
        {history.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClockCounterClockwiseIcon />
              </EmptyMedia>
              <EmptyTitle>No saved analyses</EmptyTitle>
              <EmptyDescription>Analyze a symbol and it will show up here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto px-4 pb-4">
            {history.map((item) => {
              const { spot, formattedTime, note } = describe(item);
              const isSelected = activeId && item.id ? activeId === item.id : false;
              return (
                <button
                  key={item.id ?? `${item.company}-${item.createdAt}`}
                  type="button"
                  aria-current={isSelected || undefined}
                  onClick={() => onPick(item)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50",
                    isSelected ? "bg-accent ring-1 ring-primary/50" : "bg-card",
                  )}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-base font-semibold">{item.company}</span>
                    <Badge variant="secondary" className="h-6 max-w-full rounded-md bg-accent px-2 text-xs font-normal capitalize">
                      <span className="truncate">{note}</span>
                    </Badge>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {spot != null && (
                      <span className="num text-sm">
                        ₹{Number(spot).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    {formattedTime && <span className="text-xs text-muted-foreground">{formattedTime} IST</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
