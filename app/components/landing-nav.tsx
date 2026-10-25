"use client";

import { ListIcon } from "@phosphor-icons/react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PillLink, PillNav } from "./pill-nav";
import { ThemeToggle } from "./theme-toggle";

export const LANDING_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "strategies", label: "Strategies" },
  { id: "how-it-works", label: "How it works" },
  { id: "insights", label: "Insights" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
] as const;

export function LandingNav({
  isLoggedIn,
  onAuthClick,
}: {
  isLoggedIn: boolean;
  onAuthClick: (e: MouseEvent, fallbackHref: string) => void;
}) {
  return (
    <PillNav>
      <div className="flex items-center max-lg:hidden">
        {LANDING_SECTIONS.map((s) => (
          <PillLink key={s.id} asChild>
            <a href={`#${s.id}`}>{s.label}</a>
          </PillLink>
        ))}
      </div>
      <ThemeToggle />
      <Button asChild size="lg" className="rounded-full font-semibold">
        <Link href={isLoggedIn ? "/dashboard" : "/auth/sign-in"} onClick={(e) => onAuthClick(e, "/auth/sign-in")}>
          {isLoggedIn ? "Dashboard" : "Sign in"}
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-lg" className="rounded-full lg:hidden">
            <ListIcon />
            <span className="sr-only">Open section menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {LANDING_SECTIONS.map((s) => (
            <DropdownMenuItem key={s.id} asChild className="px-2 py-2">
              <a href={`#${s.id}`}>{s.label}</a>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="px-2 py-2">
            <a href="https://github.com/Chidanandareddyj/OptionPilot" target="_blank" rel="noopener noreferrer">
              GitHub repository
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </PillNav>
  );
}
