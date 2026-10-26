"use client";

import {
  BuildingsIcon,
  ChartLineUpIcon,
  CheckIcon,
  CircleHalfIcon,
  ClockCounterClockwiseIcon,
  GearIcon,
  ListBulletsIcon,
  ShieldCheckIcon,
  SignOutIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { THEMES } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import type { AppView } from "./app-shell";
import type { ShellUser } from "./avatar-menu";
import { useThemeLabel } from "./theme-toggle";

export function MobileBottomNav({
  active,
  user,
  historyCount,
  onOpenHistory,
  onNavigate,
}: {
  active: AppView;
  user: ShellUser;
  historyCount?: number;
  onOpenHistory?: () => void;
  onNavigate?: (view: "terminal" | "derivatives") => void;
}) {
  const router = useRouter();
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const themeLabel = useThemeLabel();

  const initials = (user.name || user.email || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleTerminal = () => {
    if (onNavigate) {
      onNavigate("terminal");
    } else {
      router.push("/dashboard");
    }
  };

  const handleDerivatives = () => {
    if (onNavigate) {
      onNavigate("derivatives");
    } else {
      router.push("/dashboard?view=derivatives");
    }
  };

  const handleHistory = () => {
    if (onOpenHistory) {
      onOpenHistory();
    } else {
      router.push("/dashboard?history=open");
    }
  };

  return (
    <>
      <nav
        aria-label="Mobile Navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-border bg-card/95 px-2 backdrop-blur-lg supports-[backdrop-filter]:bg-card/80 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {/* 1. Strategy Terminal */}
        <button
          type="button"
          onClick={handleTerminal}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-xs font-medium transition-colors outline-none",
            active === "terminal"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
              active === "terminal" ? "bg-primary/15" : "bg-transparent"
            )}
          >
            <ChartLineUpIcon className="size-5" weight={active === "terminal" ? "bold" : "regular"} />
          </div>
          <span>Terminal</span>
        </button>

        {/* 2. All Derivatives / Live Market */}
        <button
          type="button"
          onClick={handleDerivatives}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-xs font-medium transition-colors outline-none",
            active === "derivatives"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
              active === "derivatives" ? "bg-primary/15" : "bg-transparent"
            )}
          >
            <ListBulletsIcon className="size-5" weight={active === "derivatives" ? "bold" : "regular"} />
          </div>
          <span>Market</span>
        </button>

        {/* 3. Analysis History */}
        <button
          type="button"
          onClick={handleHistory}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none hover:text-foreground"
        >
          <div className="relative flex h-7 w-12 items-center justify-center rounded-full">
            <ClockCounterClockwiseIcon className="size-5" />
            {historyCount !== undefined && historyCount > 0 && (
              <span className="absolute top-0 right-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {historyCount > 9 ? "9+" : historyCount}
              </span>
            )}
          </div>
          <span>History</span>
        </button>

        {/* 4. Account Drawer Trigger */}
        <button
          type="button"
          onClick={() => setAccountSheetOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-xs font-medium transition-colors outline-none",
            active === "settings"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
              active === "settings" ? "bg-primary/15" : "bg-transparent"
            )}
          >
            {user.image ? (
              <Avatar className="size-5">
                <AvatarImage src={user.image} alt={user.name || "User"} />
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
              </Avatar>
            ) : (
              <UserCircleIcon className="size-5" weight={active === "settings" ? "bold" : "regular"} />
            )}
          </div>
          <span>Account</span>
        </button>
      </nav>

      {/* Mobile Account & Organization Bottom Sheet */}
      <Sheet open={accountSheetOpen} onOpenChange={setAccountSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl p-0">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/20" />

          <SheetHeader className="px-5 pt-3 pb-2 text-left">
            <div className="flex items-center gap-3">
              <Avatar className="size-11 rounded-lg">
                {user.image && <AvatarImage src={user.image} alt="" className="rounded-lg" />}
                <AvatarFallback className="rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <SheetTitle className="truncate text-base font-semibold text-foreground">
                  {user.name || "User Account"}
                </SheetTitle>
                <SheetDescription className="truncate text-xs text-muted-foreground">
                  {user.email || "Signed in"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Organization Info Card */}
          <div className="mx-4 my-2 rounded-xl border border-border bg-muted/60 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BuildingsIcon className="size-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Organization</span>
              </div>
              <Badge variant="outline" className="h-5 text-[10px] text-primary border-primary">
                Active
              </Badge>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-bold text-sm tracking-tight text-foreground">
                OptionPilot
              </span>
              <Link
                href="/account/organizations"
                onClick={() => setAccountSheetOpen(false)}
                className="text-xs text-primary font-medium hover:underline"
              >
                Manage
              </Link>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="flex flex-col gap-1 px-4 py-2">
            <span className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Account &amp; Security
            </span>
            <Link
              href="/account/settings"
              onClick={() => setAccountSheetOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <GearIcon className="size-4 text-muted-foreground" />
              <span>Account Settings</span>
            </Link>
            <Link
              href="/account/organizations"
              onClick={() => setAccountSheetOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <BuildingsIcon className="size-4 text-muted-foreground" />
              <span>Organizations</span>
            </Link>
            <Link
              href="/account/security"
              onClick={() => setAccountSheetOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <ShieldCheckIcon className="size-4 text-muted-foreground" />
              <span>Security</span>
            </Link>
          </div>

          {/* Theme Selection using native buttons (dialog-safe) */}
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CircleHalfIcon className="size-4" /> Appearance
              </span>
              <span className="text-xs text-muted-foreground">{themeLabel}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
              {THEMES.map((t) => {
                const isCurrent = theme === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                      isCurrent
                        ? "bg-card text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{t.label} ({t.description})</span>
                    {isCurrent && <CheckIcon className="size-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sign Out Action */}
          <div className="border-t border-border p-4">
            <Link
              href="/auth/sign-out"
              prefetch={false}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <SignOutIcon className="size-4" />
              <span>Sign Out</span>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
