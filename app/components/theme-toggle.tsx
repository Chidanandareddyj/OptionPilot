"use client";

import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { THEMES } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

/** Icon button that flips between Saffron (dark) and Paper (light). Icons swap via CSS so SSR markup matches. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      className={cn("rounded-full text-muted-foreground hover:text-foreground", className)}
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
      <span className="sr-only">Toggle colour theme</span>
    </Button>
  );
}

/** Radio items for picking a theme inside a dropdown menu. */
export function ThemeRadioItems() {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
      {THEMES.map((t) => (
        <DropdownMenuRadioItem key={t.value} value={t.value} className="px-2 py-2">
          {t.label}
          <span className="ml-auto text-xs text-muted-foreground">{t.description}</span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}

export function useThemeLabel() {
  const { theme } = useTheme();
  return THEMES.find((t) => t.value === theme)?.label;
}
