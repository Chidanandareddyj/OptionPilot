"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserButton } from "@neondatabase/auth-ui";
import { usePageTransition } from "@/app/components/loading-overlay";
import { OptionPilotLogo } from "@/app/components/OptionPilotLogo";


function Clock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          timeZone: "Asia/Kolkata",
          hour12: false,
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const hm = time ? time.slice(0, 5) : "--:--";
  const s = time ? time.slice(5) : ":--";

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-2.5 sm:px-3 py-1 font-serif text-[15px] sm:text-[16px] tracking-wide text-white shadow-sm">
      <span className="relative flex size-2 shrink-0 items-center justify-center" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
      </span>
      <span className="inline-flex items-baseline font-serif tabular-nums">
        NSE {hm}
        <span className="text-white/45">{s}</span>
        <span className="ml-1.5 font-sans text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-wider text-white/45 not-tabular-nums max-sm:hidden">
          IST
        </span>
      </span>
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
        <Clock />
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
