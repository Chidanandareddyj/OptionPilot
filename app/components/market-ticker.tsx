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
  indices: {
    nifty: IndexData;
    bankNifty: IndexData;
  };
}

const DEFAULT_MARKET_STATE: MarketState = {
  isLive: false,
  status: "CLOSED",
  indices: {
    nifty: {
      symbol: "NIFTY 50",
      price: 22888.95,
      netChange: -257.2,
      percentChange: -1.11,
      close: 22888.95,
    },
    bankNifty: {
      symbol: "BANKNIFTY",
      price: 55488.1,
      netChange: -355.9,
      percentChange: -0.64,
      close: 55488.1,
    },
  },
};

function formatPrice(val: number): string {
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function IndexQuote({ label, data, flash, className }: { label: string; data: IndexData; flash: boolean; className?: string }) {
  const up = data.netChange >= 0;
  const Arrow = up ? ArrowUpIcon : ArrowDownIcon;
  return (
    <span className={cn("flex items-center gap-2 rounded-sm px-1 transition-colors duration-500", flash && "bg-primary/15", className)}>
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

/** NIFTY and BANKNIFTY quotes, polled from the market indices API. */
export function MarketTicker({ className, showStatus = true }: { className?: string; showStatus?: boolean }) {
  const [market, setMarket] = useState<MarketState>(DEFAULT_MARKET_STATE);
  const [tickActive, setTickActive] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchIndices() {
      try {
        const res = await fetch("/api/market/indices");
        if (!res.ok) return;
        const data: MarketState = await res.json();
        if (mounted && data.indices) {
          setMarket(data);
          setTickActive(true);
          setTimeout(() => {
            if (mounted) setTickActive(false);
          }, 800);
        }
      } catch {
        // Silently preserve state
      }
    }

    fetchIndices();
    const interval = setInterval(fetchIndices, 4500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const { nifty, bankNifty } = market.indices;
  const isLive = market.isLive;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground", className)}
      title={isLive ? "Market open, live prices" : "Market closed, last traded prices"}
    >
      {showStatus && (
        <span className="flex items-center gap-2">
          <span aria-hidden className={cn("size-2 rounded-full", isLive ? "bg-profit" : "bg-faint")} />
          NSE {isLive ? "open" : "closed"}
        </span>
      )}
      <IndexQuote label="NIFTY 50" data={nifty} flash={tickActive} />
      <IndexQuote label="BANKNIFTY" data={bankNifty} flash={tickActive} className="max-sm:hidden" />
    </div>
  );
}
