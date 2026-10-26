"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function MarketClock({ className }: { className?: string }) {
  const [time, setTime] = useState<string | null>(null);
  const [scheduledOpen, setScheduledOpen] = useState(false);
  const [feedStatus, setFeedStatus] = useState<boolean | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-GB", {
          timeZone: "Asia/Kolkata",
          hour12: false,
        })
      );

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
      setScheduledOpen(isWeekday && totalMinutes >= 555 && totalMinutes < 930);
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
        setFeedStatus(status === "NORMAL_OPEN");
      }
    };
    window.addEventListener("market-status", handleStatus);
    return () => window.removeEventListener("market-status", handleStatus);
  }, []);

  const isOpen = feedStatus !== null ? feedStatus : scheduledOpen;

  return (
    <span
      title={isOpen ? "Market live (NSE, IST)" : "Market closed, showing last traded values (NSE, IST)"}
      className={cn("flex items-center gap-2 text-xs whitespace-nowrap text-muted-foreground", className)}
    >
      <span aria-hidden className={cn("size-2 rounded-full", isOpen ? "bg-profit" : "bg-faint")} />
      NSE {isOpen ? "open" : "closed"}
      <span className="num text-foreground">{time ?? "--:--:--"} IST</span>
    </span>
  );
}
