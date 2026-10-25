"use client";

import { ChartLineUpIcon, ClockCounterClockwiseIcon, GearIcon, ListBulletsIcon } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AvatarMenu, type ShellUser } from "./avatar-menu";
import { MarketClock } from "./market-clock";
import { PillLink, PillNav } from "./pill-nav";

export type AppView = "terminal" | "derivatives" | "settings";

const VIEW_HREF = { terminal: "/dashboard", derivatives: "/dashboard?view=derivatives" } as const;

const RAIL_ITEM =
  "flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-active:bg-accent data-active:font-medium data-active:text-foreground [&_svg]:size-4 [&_svg]:shrink-0";

/** Renders a button when the dashboard switches views in place, otherwise a link. */
function ViewLink({
  view,
  active,
  onNavigate,
  className,
  children,
}: {
  view: "terminal" | "derivatives";
  active: boolean;
  onNavigate?: (view: "terminal" | "derivatives") => void;
  className?: string;
  children: ReactNode;
}) {
  const shared = { "data-active": active || undefined, "aria-current": active ? ("page" as const) : undefined, className };
  return onNavigate ? (
    <button type="button" onClick={() => onNavigate(view)} {...shared}>
      {children}
    </button>
  ) : (
    <Link href={VIEW_HREF[view]} {...shared}>
      {children}
    </Link>
  );
}

export function AppShell({
  active,
  user,
  rail,
  historyCount,
  onOpenHistory,
  onNavigate,
  children,
}: {
  active: AppView;
  user: ShellUser;
  /** Extra rail content above the views group, e.g. symbol search. */
  rail?: ReactNode;
  historyCount?: number;
  onOpenHistory?: () => void;
  onNavigate?: (view: "terminal" | "derivatives") => void;
  children: ReactNode;
}) {
  const pill = (view: "terminal" | "derivatives", label: ReactNode) => (
    <PillLink asChild active={active === view}>
      <ViewLink view={view} active={active === view} onNavigate={onNavigate}>
        {label}
      </ViewLink>
    </PillLink>
  );

  return (
    <div className="min-h-screen bg-background">
      <PillNav brandHref="/">
        {pill("terminal", "Terminal")}
        {pill(
          "derivatives",
          <>
            <span className="sm:hidden">Derivatives</span>
            <span className="max-sm:hidden">All derivatives</span>
          </>,
        )}
        <MarketClock className="px-3 max-md:hidden" />
        <div className="pr-1">
          <AvatarMenu user={user} historyCount={historyCount} onOpenHistory={onOpenHistory} />
        </div>
      </PillNav>

      <div className="flex flex-col gap-4 px-4 pt-20 pb-8 lg:flex-row lg:items-start">
        <aside
          className={cn(
            "flex flex-col gap-4 rounded-xl bg-card p-3 ring-1 ring-foreground/10 lg:sticky lg:top-20 lg:w-64 lg:shrink-0",
            !rail && "max-lg:hidden",
          )}
        >
          {rail}
          <nav aria-label="Views" className="flex flex-col gap-1 max-lg:hidden">
            <span className="px-2 pb-1 text-xs text-muted-foreground">Views</span>
            <ViewLink view="terminal" active={active === "terminal"} onNavigate={onNavigate} className={RAIL_ITEM}>
              <ChartLineUpIcon /> Strategy terminal
            </ViewLink>
            <ViewLink view="derivatives" active={active === "derivatives"} onNavigate={onNavigate} className={RAIL_ITEM}>
              <ListBulletsIcon /> All derivatives
            </ViewLink>
            {onOpenHistory ? (
              <button type="button" onClick={onOpenHistory} className={RAIL_ITEM}>
                <ClockCounterClockwiseIcon /> History
                {historyCount !== undefined && (
                  <span className="num ml-auto rounded bg-accent px-2 text-xs text-muted-foreground">{historyCount}</span>
                )}
              </button>
            ) : (
              <Link href="/dashboard?history=open" className={RAIL_ITEM}>
                <ClockCounterClockwiseIcon /> History
              </Link>
            )}
            <Link href="/account/settings" data-active={active === "settings" || undefined} className={RAIL_ITEM}>
              <GearIcon /> Settings
            </Link>
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
