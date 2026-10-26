/** Geist and Geist Mono. Tailwind's default type scale. No italics. */
export const fonts = {
  sans: "Geist",
  mono: "Geist Mono",
  italics: false,
} as const;

export const typeScale = {
  xs: { size: "0.75rem", lineHeight: "calc(1 / 0.75)" },
  sm: { size: "0.875rem", lineHeight: "calc(1.25 / 0.875)" },
  base: { size: "1rem", lineHeight: "calc(1.5 / 1)" },
  lg: { size: "1.125rem", lineHeight: "calc(1.75 / 1.125)" },
  xl: { size: "1.25rem", lineHeight: "calc(1.75 / 1.25)" },
  "2xl": { size: "1.5rem", lineHeight: "calc(2 / 1.5)" },
  "3xl": { size: "1.875rem", lineHeight: "calc(2.25 / 1.875)" },
  "4xl": { size: "2.25rem", lineHeight: "calc(2.5 / 2.25)" },
  "5xl": { size: "3rem", lineHeight: "1" },
  "6xl": { size: "3.75rem", lineHeight: "1" },
  "7xl": { size: "4.5rem", lineHeight: "1" },
  "8xl": { size: "6rem", lineHeight: "1" },
  "9xl": { size: "8rem", lineHeight: "1" },
} as const;
