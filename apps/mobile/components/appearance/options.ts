import { semantic } from "@optionpilot/shared";
import type { Appearance } from "@/lib/theme/ThemeProvider";

/** What the Settings row shows: the theme's name (design 56), or "System" when it follows the phone. */
export const APPEARANCE_ROW_VALUE: Record<Appearance, string> = {
  system: "System",
  dark: "Saffron",
  light: "Paper",
};

export const APPEARANCE_LABELS: Record<Appearance, string> = {
  system: "System",
  dark: "Dark",
  light: "Light",
};

export type AppearanceOption = {
  value: Appearance;
  title: string;
  description: string;
  /** Swatch colours: the page and the accent dot. `system` shows both pages side by side. */
  swatch: { background: string; dot?: string; split?: string };
};

export const APPEARANCE_OPTIONS: AppearanceOption[] = [
  {
    value: "system",
    title: "System",
    description: "Match your phone",
    swatch: { background: semantic.saffron.background, split: semantic.paper.background },
  },
  {
    value: "dark",
    title: "Dark",
    description: "Saffron on warm black",
    swatch: { background: semantic.saffron.background, dot: semantic.saffron.primary },
  },
  {
    value: "light",
    title: "Light",
    description: "Paper",
    swatch: { background: semantic.paper.background, dot: semantic.paper.primary },
  },
];
