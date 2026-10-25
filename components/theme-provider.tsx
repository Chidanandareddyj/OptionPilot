"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export const THEMES = [
  { value: "dark", label: "Saffron", description: "Dark" },
  { value: "light", label: "Paper", description: "Light" },
] as const;

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      themes={THEMES.map((t) => t.value)}
      enableSystem={false}
      storageKey="optionpilot-theme"
      disableTransitionOnChange
      {...props}
    />
  );
}
