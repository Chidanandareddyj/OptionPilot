"use client";

import { ArrowDownIcon, ArrowUpIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface IndexData {
  symbol: string;
  price: number;
  netChange: number;
  percentChange: number;
  close: number;
}

interface MarketState {
  isLive: boolean;
  status: "OPEN" | "CLOSED";
  source?: "live" | "cached" | "unavailable" | "fallback";
  indices?: {
    nifty: IndexData;
    bankNifty: IndexData;
  } | null;
}

const STORAGE_KEY = "optionpilot_last_indices";

function formatPrice(val: number): string {
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function IndexQuote({
  label,
  data,
  flash,
  className,
}: {
  label: string;
  data?: IndexData | null;
  flash: boolean;
  className?: string;
}) {
  if (!data || typeof data.price !== "number") {
    return (
      <span className={cn("flex items-center gap-2 rounded-sm px-1 text-muted-foreground", className)}>
        <span>{label}</span>
        <span className="num text-muted-foreground/40">—</span>
      </span>
    );
  }

  const up = data.netChange >= 0;
  const Arrow = up ? ArrowUpIcon : ArrowDownIcon;
  return (
    <span
      className={cn(
        "flex items-center gap-2 rounded-sm px-1 transition-colors duration-500",
        flash && "bg-primary/15",
        className,
      )}
    >
      <span>{label}</span>
      <span className="num text-foreground">{formatPrice(data.price)}</span>
      <span className={cn("num flex items-center gap-1", up ? "text-profit" : "text-loss")}>
        <Arrow aria-hidden className="size-3" />
        {up ? "+" : "\u2212"}
        {Math.abs(data.netChange).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </span>
    </span>
  );
}

/** NIFTY and BANKNIFTY quotes, polled from the market indices API and cached in localStorage. */
export function MarketTicker({ className, showStatus = true }: { className?: string; showStatus?: boolean }) {
  const [market, setMarket] = useState<MarketState>({
    isLive: false,
    status: "CLOSED",
    indices: null,
  });
  const [tickActive, setTickActive] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 1. Hydrate from localStorage on client mount if available
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MarketState;
        if (parsed?.indices?.nifty && parsed?.indices?.bankNifty) {
          setMarket(parsed);
        }
      }
    } catch {
      // Local storage unreadable or unavailable
    }

    // 2. Fetch live data from server
    async function fetchIndices() {
      try {
        const res = await fetch("/api/market/indices");
        if (!res.ok) return;
        const data: MarketState = await res.json();
        if (mounted && data.indices?.nifty && data.indices?.bankNifty) {
          setMarket(data);
          setTickActive(true);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          } catch {
            // Local storage quota or security error
          }
          setTimeout(() => {
            if (mounted) setTickActive(false);
          }, 800);
        }
      } catch {
        // Network error - retain cached state silently
      }
    }

    fetchIndices();
    const interval = setInterval(fetchIndices, 4500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const nifty = market.indices?.nifty ?? null;
  const bankNifty = market.indices?.bankNifty ?? null;
  const isLive = market.isLive;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground", className)}
      title={isLive ? "Market open, live real-time prices" : "Market closed, showing last live close prices"}
    >
      {showStatus && (
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className={cn("size-2 rounded-full", isLive ? "bg-profit animate-pulse" : "bg-faint")}
          />
          <span className="text-xs font-medium">
            {isLive ? "Live" : "Closed · Last Close"}
          </span>
        </span>
      )}
      <IndexQuote label="NIFTY 50" data={nifty} flash={tickActive} />
      <IndexQuote label="BANKNIFTY" data={bankNifty} flash={tickActive} className="max-sm:hidden" />
    </div>
  );
}
