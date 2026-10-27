import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cn } from "@/lib/cn";
import { textStyles, tightLetterSpacing, type TextSize } from "@/lib/theme/typography";

export type TextTone =
  | "foreground"
  | "muted"
  | "faint"
  | "primary"
  | "onPrimary"
  | "profit"
  | "loss";
export type TextWeight = "regular" | "medium" | "semibold";

const toneClass: Record<TextTone, string> = {
  foreground: "text-foreground",
  muted: "text-muted-foreground",
  faint: "text-faint",
  primary: "text-primary",
  onPrimary: "text-primary-foreground",
  profit: "text-profit",
  loss: "text-loss",
};

const sansClass: Record<TextWeight, string> = {
  regular: "font-geist",
  medium: "font-geist-medium",
  semibold: "font-geist-semibold",
};

// Geist Mono is bundled in two weights; semibold falls back to medium.
const monoClass: Record<TextWeight, string> = {
  regular: "font-geist-mono",
  medium: "font-geist-mono-medium",
  semibold: "font-geist-mono-medium",
};

export type TextProps = RNTextProps & {
  /** A step of the shared type scale. Defaults to `base` (16 / 24). */
  size?: TextSize;
  weight?: TextWeight;
  tone?: TextTone;
  mono?: boolean;
  /** Heading letter spacing of -0.02em. */
  tight?: boolean;
  className?: string;
};

export function Text({
  size = "base",
  weight = "regular",
  tone = "foreground",
  mono = false,
  tight = false,
  className,
  style,
  ...props
}: TextProps) {
  const base = textStyles[size];
  return (
    <RNText
      className={cn(mono ? monoClass[weight] : sansClass[weight], toneClass[tone], className)}
      style={[base, tight && { letterSpacing: tightLetterSpacing(base.fontSize ?? 16) }, style]}
      {...props}
    />
  );
}
