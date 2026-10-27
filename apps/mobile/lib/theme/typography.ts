import { typeScale } from "@optionpilot/shared";
import type { TextStyle } from "react-native";

export type TextSize = keyof typeof typeScale;

const REM = 16;

/** "calc(1.25 / 0.875)" or "1" is a unitless line height relative to the font size. */
function parseLineHeight(value: string): number {
  const calc = /^calc\(([\d.]+)\s*\/\s*([\d.]+)\)$/.exec(value);
  return calc ? Number(calc[1]) / Number(calc[2]) : Number(value);
}

function toStyle({ size, lineHeight }: { size: string; lineHeight: string }): TextStyle {
  const fontSize = Math.round(parseFloat(size) * REM);
  return { fontSize, lineHeight: Math.round(fontSize * parseLineHeight(lineHeight)) };
}

/** Pixel font size and line height for every step of the shared type scale, e.g. `4xl` is 36 / 40. */
export const textStyles = Object.fromEntries(
  Object.entries(typeScale).map(([key, value]) => [key, toStyle(value)]),
) as Record<TextSize, TextStyle>;

/** The design tightens headings by -0.02em, which React Native takes in pixels. */
export function tightLetterSpacing(fontSize: number): number {
  return Math.round(fontSize * -0.02 * 100) / 100;
}
