"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserButton } from "@neondatabase/auth-ui";
import { usePageTransition } from "@/app/components/loading-overlay";

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 2 22 12 12 22 2 12Z" />
      <path d="M12 7v10M7 12h10" />
    </svg>
  );
}

function Clock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[13px] tabular-nums">
      <span className="size-1.5 rounded-full bg-emerald-400" />
      <span className="font-sans text-[11px] font-semibold text-white/60">NSE</span>
      <span>
        {time ? time.slice(0, -6) : "--:--"}
        <span className="text-white/40 max-sm:hidden">{time ? time.slice(-6, -3) : ":--"}</span>
      </span>
      <span className="font-sans text-[10px] font-semibold text-sky-300">{time?.slice(-2)}</span>
      <span className="font-sans text-[10px] text-white/40 max-sm:hidden">IST</span>
    </span>
  );
}

export default function DashboardHeader({ name }: { name?: string | null }) {
  const { navigateWithLoader } = usePageTransition();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/10 bg-[#051a44]/85 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-5">
        <Link
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigateWithLoader("/", "Loading OptionPilot...");
          }}
          className="flex items-center gap-2 text-[16px] font-semibold tracking-tight hover:text-white/80"
        >
          <Mark className="size-5" />
          <span className="max-[380px]:hidden">OptionPilot</span>
        </Link>
        <span className="border-l border-white/15 pl-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45 max-md:hidden">
          Strategy Terminal
        </span>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <Clock />
        {name && <span className="text-xs text-white/70 max-lg:hidden">{name}</span>}
        <UserButton size="icon" />
      </div>
    </header>
  );
}
