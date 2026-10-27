"use client";

import {
  CaretDownIcon,
  MagnifyingGlassIcon,
  SparkleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  NSE_FO_SYMBOLS,
  POPULAR_COMPANIES,
  QUICK,
  symbolName,
  type Suggestion,
} from "@/app/dashboard/symbol-search";
import { cn } from "@/lib/utils";

export function MobileSymbolSheet({
  activeSymbol,
  spotPrice,
  disabled,
  onSelect,
}: {
  activeSymbol?: string;
  spotPrice?: number;
  disabled?: boolean;
  onSelect: (symbol: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return POPULAR_COMPANIES;
    return NSE_FO_SYMBOLS.filter(
      (s) =>
        s.symbol.toUpperCase().includes(q) ||
        s.name.toUpperCase().includes(q) ||
        (s.sector && s.sector.toUpperCase().includes(q))
    ).slice(0, 20);
  }, [query]);

  const handlePick = (symbol: string) => {
    onSelect(symbol);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      {/* Top Mobile Bar Trigger (Visible only on < lg screens) */}
      <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-xs lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <div className="flex min-w-0 items-center gap-2">
            <MagnifyingGlassIcon className="size-4 shrink-0 text-muted-foreground" />
            {activeSymbol ? (
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="font-semibold text-foreground tracking-tight">
                  {activeSymbol.toUpperCase()}
                </span>
                {spotPrice && spotPrice > 0 ? (
                  <span className="num text-xs text-muted-foreground">
                    ₹{spotPrice.toLocaleString("en-IN", { minimumFractionDigits: 1 })}
                  </span>
                ) : null}
              </div>
            ) : (
              <span className="truncate text-xs text-muted-foreground">
                Search F&amp;O symbols (NIFTY, RELIANCE...)
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <span>Change</span>
            <CaretDownIcon className="size-3.5" />
          </div>
        </button>
      </div>

      {/* Bottom Sheet Drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] rounded-t-2xl p-0 focus:outline-none"
        >
          {/* Visual Grab Handle */}
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/20" />

          <SheetHeader className="px-4 pt-2 pb-1 text-left">
            <SheetTitle className="text-lg font-semibold tracking-tight">
              Select F&amp;O Underlying
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Search by symbol, stock name, or index to analyze strategies.
            </SheetDescription>
          </SheetHeader>

          {/* Search Input Box */}
          <div className="px-4 py-2">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search symbol (e.g. INFY, BANKNIFTY)..."
                className="h-10 bg-muted pl-9 pr-9 text-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick F&O Symbol Chips */}
          <div className="flex flex-col gap-1 border-b border-border px-4 pb-3">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Quick Underlyings
            </span>
            <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
              {QUICK.map((sym) => {
                const isCurrent = activeSymbol?.toUpperCase() === sym;
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => handlePick(sym)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-accent"
                    )}
                  >
                    <span>{sym}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Suggestion List */}
          <div className="flex-1 overflow-y-auto px-2 py-2" style={{ maxHeight: "45vh" }}>
            <div className="px-2 pb-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {query ? "Search Results" : "Popular F&O Stocks"}
            </div>
            {filtered.length > 0 ? (
              <ul className="flex flex-col gap-0.5">
                {filtered.map((item) => {
                  const isCurrent = activeSymbol?.toUpperCase() === item.symbol;
                  return (
                    <li key={item.symbol}>
                      <button
                        type="button"
                        onClick={() => handlePick(item.symbol)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent",
                          isCurrent && "bg-accent/80 font-medium"
                        )}
                      >
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-sm">
                              {item.symbol}
                            </span>
                            {isCurrent && (
                              <Badge variant="outline" className="h-4 px-1 text-[10px] text-primary border-primary">
                                Current
                              </Badge>
                            )}
                          </div>
                          <span className="truncate text-xs text-muted-foreground">
                            {item.name}
                          </span>
                        </div>
                        {item.sector && (
                          <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                            {item.sector}
                          </Badge>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <p>No predefined match for &ldquo;{query}&rdquo;.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => handlePick(query.trim().toUpperCase())}
                >
                  Analyze &ldquo;{query.trim().toUpperCase()}&rdquo; directly
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
