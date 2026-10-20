"use client";

import React, { useState, useEffect } from "react";

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

export function RollingStrategyPill() {
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
      } catch (err) {
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
    <div className="w-full flex items-center justify-between rounded-full border border-white/12 bg-[#07245c]/70 backdrop-blur-xl px-3.5 py-1.5 shadow-lg text-[11px] font-mono tracking-tight select-none">
      {/* Status dot: Emerald if live, muted amber if market closed */}
      <div className="flex items-center gap-1.5 shrink-0" title={isLive ? "Market Open (Live Stream)" : "Market Closed (Last Traded Price)"}>
        <span className="relative flex h-2 w-2">
          {isLive ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400/80"></span>
          )}
        </span>
        <span className={`font-sans font-semibold text-[10px] uppercase tracking-wider ${isLive ? "text-emerald-400" : "text-amber-400/90"}`}>
          {isLive ? "LIVE" : "NSE"}
        </span>
      </div>

      {/* Index Values */}
      <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
        {/* NIFTY 50 */}
        <div
          className={`inline-flex items-center gap-1.5 transition-colors duration-500 px-1.5 py-0.5 rounded ${
            tickActive ? "bg-cyan-400/15" : "bg-transparent"
          }`}
        >
          <span className="text-white/50 font-sans text-[10px] font-medium">NIFTY</span>
          <span className="text-white font-semibold tabular-nums">{formatPrice(nifty.price)}</span>
          <span
            className={`text-[10px] tabular-nums font-semibold ${
              nifty.netChange >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {nifty.netChange >= 0 ? `+${nifty.netChange}` : nifty.netChange}
          </span>
        </div>

        <span className="text-white/20 hidden sm:inline">•</span>

        {/* BANKNIFTY */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 transition-colors duration-500 px-1.5 py-0.5 rounded ${
            tickActive ? "bg-cyan-400/15" : "bg-transparent"
          }`}
        >
          <span className="text-white/50 font-sans text-[10px] font-medium">BANKNIFTY</span>
          <span className="text-white font-semibold tabular-nums">{formatPrice(bankNifty.price)}</span>
          <span
            className={`text-[10px] tabular-nums font-semibold ${
              bankNifty.netChange >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {bankNifty.netChange >= 0 ? `+${bankNifty.netChange}` : bankNifty.netChange}
          </span>
        </div>
      </div>
    </div>
  );
}
