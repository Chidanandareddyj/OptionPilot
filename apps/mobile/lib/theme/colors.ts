import { semantic, type SemanticName } from "@optionpilot/shared";

export type Scheme = "light" | "dark";
export type ThemeColors = Record<SemanticName, string>;

/** Saffron is the dark theme and Paper the light theme, as on the website. */
export const themeColors: Record<Scheme, ThemeColors> = {
  dark: semantic.saffron,
  light: semantic.paper,
};

/** "#rrggbb" and an opacity from 0 to 1 become an `rgba()` string. */
export function withAlpha(hex: string, alpha: number): string {
  const value = parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = (value & 255);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Colours the design uses for glass, scrims and payoff fills, derived from the theme colours. */
export function surfaceColors(scheme: Scheme) {
  const c = themeColors[scheme];
  const dark = scheme === "dark";
  return {
    glass: withAlpha(c.card, 0.94),
    glassBackground: withAlpha(c.background, 0.94),
    scrim: dark ? "rgba(0,0,0,0.56)" : "rgba(28,26,23,0.36)",
    profitFill: withAlpha(c.profit, dark ? 0.18 : 0.16),
    lossFill: withAlpha(c.loss, dark ? 0.18 : 0.14),
    shadow: dark ? "rgba(0,0,0,0.5)" : "rgba(28,26,23,0.16)",
  };
}
