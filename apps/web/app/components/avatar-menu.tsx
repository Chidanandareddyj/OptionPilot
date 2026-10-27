"use client";

import { CircleHalfIcon, ClockCounterClockwiseIcon, GearIcon, SignOutIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeRadioItems, useThemeLabel } from "./theme-toggle";

export type ShellUser = { name?: string | null; email?: string | null; image?: string | null };

function initials({ name, email }: ShellUser) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] ?? email ?? "?").slice(0, 2).toUpperCase();
}

const ITEM = "gap-2 px-2 py-2";

export function AvatarMenu({
  user,
  historyCount,
  onOpenHistory,
}: {
  user: ShellUser;
  historyCount?: number;
  /** Opens the history sheet in place; without it the item links to the dashboard's sheet. */
  onOpenHistory?: () => void;
}) {
  const themeLabel = useThemeLabel();
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Avatar className="size-8 rounded-md after:rounded-md">
          {user.image && <AvatarImage src={user.image} alt="" className="rounded-md" />}
          <AvatarFallback className="rounded-md bg-primary text-xs font-semibold text-primary-foreground">{initials(user)}</AvatarFallback>
        </Avatar>
        <span className="sr-only">Account menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-2">
        <DropdownMenuLabel className="flex flex-col gap-1 px-2 py-2 font-normal">
          <span className="truncate text-sm font-medium text-foreground">{user.name || "Your account"}</span>
          {user.email && <span className="truncate text-xs text-muted-foreground">{user.email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className={ITEM} asChild>
            <Link href="/account/settings">
              <GearIcon /> Settings
            </Link>
          </DropdownMenuItem>
          {onOpenHistory ? (
            <DropdownMenuItem className={ITEM} onSelect={onOpenHistory}>
              <ClockCounterClockwiseIcon /> History
              {historyCount !== undefined && <span className="num ml-auto text-xs text-muted-foreground">{historyCount}</span>}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className={ITEM} asChild>
              <Link href="/dashboard?history=open">
                <ClockCounterClockwiseIcon /> History
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className={ITEM}>
              <CircleHalfIcon /> Appearance
              <span className="ml-auto text-xs text-muted-foreground">{themeLabel}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48 p-2">
              <ThemeRadioItems />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={ITEM} asChild>
          <Link href="/auth/sign-out" prefetch={false}>
            <SignOutIcon /> Sign out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
