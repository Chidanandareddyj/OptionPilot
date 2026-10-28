"use client";

import {
  ArrowLeftIcon,
  CaretDownIcon,
  MagnifyingGlassIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

  // Ensure input gets focused reliably upon opening
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handlePick = (symbol: string) => {
    onSelect(symbol);
    setOpen(false);
    setQuery("");
  };

  const handleSubmit = () => {
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return;
    if (filtered.length > 0) {
      handlePick(filtered[0].symbol);
    } else {
      handlePick(trimmed);
    }
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

      {/* Full-Screen Top-Anchored Mobile Search Modal */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="top"
          showCloseButton={false}
          className="fixed inset-0 flex h-[100dvh] max-h-[100dvh] w-full flex-col gap-0 rounded-none border-none bg-background p-0 focus:outline-none"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Select F&amp;O Underlying</SheetTitle>
            <SheetDescription>
              Search by symbol, stock name, or index to analyze strategies.
            </SheetDescription>
          </SheetHeader>

          {/* Top Bar: Back button, Search Input, and Quick Chips */}
          <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-border bg-card/95 px-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-2.5 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close search"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-95"
              >
                <ArrowLeftIcon className="size-5" />
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="relative flex-1"
              >
                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="search"
                  autoFocus
                  enterKeyHint="go"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search symbol (e.g. INFY, BANKNIFTY)..."
                  className="h-10 rounded-xl border border-input bg-muted pl-9 pr-9 text-base md:text-sm focus-visible:ring-2 focus-visible:ring-primary"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground active:scale-95"
                  >
                    <XIcon className="size-4" />
                  </button>
                ) : null}
              </form>
            </div>

            {/* Quick F&O Symbol Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 pb-0.5 scrollbar-none">
              <span className="shrink-0 pr-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Quick:
              </span>
              {QUICK.map((sym) => {
                const isCurrent = activeSymbol?.toUpperCase() === sym;
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => handlePick(sym)}
                    className={cn(
                      "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors active:scale-95",
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted/60 text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <span>{sym}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Suggestion List - Dismiss keyboard on touch/scroll */}
          <div
            ref={listRef}
            onScroll={() => inputRef.current?.blur()}
            onTouchMove={() => inputRef.current?.blur()}
            className="flex-1 overflow-y-auto px-3 py-2 overscroll-contain pb-[max(2rem,env(safe-area-inset-bottom,0px))]"
          >
            <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {query ? "Search Results" : "Popular F&O Stocks"}
            </div>
            {filtered.length > 0 ? (
              <ul className="flex flex-col gap-0.5">
                {filtered.map((item, idx) => {
                  const isCurrent = activeSymbol?.toUpperCase() === item.symbol;
                  const isFirstMatch = query.trim().length > 0 && idx === 0;
                  return (
                    <li key={item.symbol}>
                      <button
                        type="button"
                        onClick={() => handlePick(item.symbol)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent active:bg-accent/70",
                          isCurrent && "bg-accent/80 font-medium",
                          isFirstMatch && !isCurrent && "bg-muted/40"
                        )}
                      >
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {item.symbol}
                            </span>
                            {isCurrent && (
                              <Badge variant="outline" className="h-4 border-primary px-1 text-[10px] text-primary">
                                Current
                              </Badge>
                            )}
                            {isFirstMatch && !isCurrent && (
                              <Badge variant="secondary" className="h-4 px-1 text-[10px] text-muted-foreground">
                                Best match
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
              <div className="py-8 text-center text-xs text-muted-foreground">
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
