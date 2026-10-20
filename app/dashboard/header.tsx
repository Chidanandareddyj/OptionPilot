"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserButton } from "@neondatabase/auth-ui";
import { usePageTransition } from "@/app/components/loading-overlay";
import { OptionPilotLogo } from "@/app/components/OptionPilotLogo";


function MarketStatusBadge() {
  const [data, setData] = useState<{
    hm: string;
    isOpen: boolean;
  } | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      let weekday = "";
      let hour = 0;
      let minute = 0;
      for (const p of parts) {
        if (p.type === "weekday") weekday = p.value;
        if (p.type === "hour") hour = parseInt(p.value, 10);
        if (p.type === "minute") minute = parseInt(p.value, 10);
      }

      // NSE Trading Hours: Mon-Fri, 09:15 - 15:30 IST
      const isWeekday = weekday !== "Sat" && weekday !== "Sun";
      const totalMinutes = hour * 60 + minute;
      const isOpen = isWeekday && totalMinutes >= 555 && totalMinutes < 930;

      const pad = (n: number) => String(n).padStart(2, "0");
      setData((prev) => ({
        hm: `${pad(hour)}:${pad(minute)}`,
        isOpen: prev !== null ? prev.isOpen : isOpen,
      }));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Listen to feed status updates if available
  useEffect(() => {
    const handleStatus = (e: Event) => {
      const status = (e as CustomEvent).detail;
      if (typeof status === "string") {
        setData((prev) => (prev ? { ...prev, isOpen: status === "NORMAL_OPEN" } : prev));
      }
    };
    window.addEventListener("market-status", handleStatus);
    return () => window.removeEventListener("market-status", handleStatus);
  }, []);

  if (!data) return null;
  const { hm, isOpen } = data;

  if (isOpen) {
    return (
      <div
        title="Market live · Trading active (NSE/IST)"
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs text-white shadow-sm cursor-default select-none transition-colors hover:border-emerald-500/40"
      >
        <span className="relative flex size-2 shrink-0 items-center justify-center" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
        </span>
        <span className="font-semibold text-emerald-300">Live</span>
        <span className="text-white/40">·</span>
        <span className="font-mono text-white/90 tabular-nums">{hm}</span>
      </div>
    );
  }

  return (
    <div
      title="Market closed · Showing last traded values (NSE/IST)"
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-2.5 py-1 text-xs text-white shadow-sm cursor-default select-none transition-colors hover:border-amber-500/40"
    >
      <span className="size-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
      <span className="font-semibold text-amber-300">Closed</span>
      <span className="text-white/40">·</span>
      <span className="font-mono text-white/75 tabular-nums">{hm}</span>
    </div>
  );
}

export default function DashboardHeader({ name }: { name?: string | null }) {
  const { navigateWithLoader } = usePageTransition();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-2.5 sm:gap-4 border-b border-white/10 bg-[#06245e]/85 px-3.5 sm:px-6 py-2.5 sm:py-3 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
        <Link
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigateWithLoader("/", "Loading OptionPilot...");
          }}
          className="flex shrink-0 items-center gap-2 text-[15px] sm:text-[16px] font-semibold tracking-tight text-white hover:text-white/80 transition-colors cursor-pointer"
        >
          <OptionPilotLogo variant="adaptive" className="size-7 sm:size-7.5 shrink-0 text-white" />
          <span className="max-[380px]:hidden">OptionPilot</span>
        </Link>
        <span className="border-l border-white/15 pl-3 sm:pl-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45 max-md:hidden truncate">
          Strategy Terminal
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
        <MarketStatusBadge />
        {name && (
          <span className="text-xs text-white/70 max-lg:hidden truncate max-w-[120px]">
            {name}
          </span>
        )}
        <div className="flex shrink-0 items-center">
          <UserButton size="icon" />
        </div>
      </div>
    </header>
  );
}
