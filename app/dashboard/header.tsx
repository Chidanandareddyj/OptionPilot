"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserButton } from "@neondatabase/auth-ui";

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 2 22 12 12 22 2 12Z" />
      <path d="M12 7v10M7 12h10" />
    </svg>
  );
}

function getIST12h() {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600000);
  let hours = ist.getHours();
  const minutes = ist.getMinutes();
  const seconds = ist.getSeconds();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const ss = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return {
    hm: `${hours}:${mm}`,
    s: `:${ss}`,
    ampm,
  };
}

function MarketClock() {
  const [time, setTime] = useState<{ hm: string; s: string; ampm: string } | null>(null);

  useEffect(() => {
    setTime(getIST12h());
    const id = setInterval(() => setTime(getIST12h()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      suppressHydrationWarning
      className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[13px] tracking-wide shrink-0"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
      <span className="text-white/60 font-sans text-[11px] font-semibold uppercase tracking-wider mr-1">
        NSE
      </span>
      <span className="text-white font-medium tabular-nums">
        {time ? time.hm : "--:--"}
      </span>
      <span className="text-white/40 tabular-nums">
        {time ? time.s : ":--"}
      </span>
      <span className="text-[10px] text-sky-300 font-sans font-semibold uppercase ml-1">
        {time ? time.ampm : ""}
      </span>
      <span className="text-[10px] text-white/40 font-sans ml-0.5">IST</span>
    </div>
  );
}

export default function DashboardHeader({ name }: { name?: string | null }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-3.5 bg-[#051a44]">
      {/* Brand & Terminal Label */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 text-white hover:text-white/80 transition-colors">
          <Mark className="size-5 text-white" />
          <span className="font-sans text-[16px] font-semibold tracking-tight">
            OptionPilot
          </span>
        </Link>
        <div className="h-4 w-px bg-white/15 hidden sm:block" />
        <div className="hidden sm:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Strategy Terminal
          </p>
        </div>
      </div>

      {/* Clock & User controls */}
      <div className="flex items-center gap-4">
        <MarketClock />
        {name && (
          <span className="hidden md:inline font-sans text-xs text-white/70">
            {name}
          </span>
        )}
        <UserButton size="icon" />
      </div>
    </header>
  );
}
