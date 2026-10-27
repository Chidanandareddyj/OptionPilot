"use client";

import { THEMES } from "@optionpilot/shared";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export { THEMES };

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
