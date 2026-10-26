import { View } from "react-native";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme/ThemeProvider";
import type { PhosphorIcon } from "@/components/icons";
import { Text } from "./Text";

type TagProps = {
  label: string;
  icon?: PhosphorIcon;
  /** `outline` is bordered and quiet, `primary` is the accent fill used for the Spot marker. */
  variant?: "default" | "outline" | "primary";
  /** Colours an outline tag's text and icon green or red, for Viable and Not viable. */
  tone?: "profit" | "loss";
  className?: string;
};

/** The 24 px pill that names a view, a side or a marker. */
export function Tag({ label, icon: IconComponent, variant = "default", tone, className }: TagProps) {
  const { colors } = useTheme();
  const textColor = tone
    ? colors[tone]
    : variant === "primary"
      ? colors.primaryForeground
      : variant === "outline"
        ? colors.mutedForeground
        : colors.foreground;
  return (
    <View
      className={cn(
        "h-6 flex-row items-center gap-1 rounded-md px-2",
        variant === "default" && "bg-accent",
        variant === "outline" && "border",
        variant === "outline" && "border-border",
        variant === "primary" && "bg-primary",
        className,
      )}
    >
      {IconComponent ? <IconComponent size={12} weight="bold" color={textColor} /> : null}
      <Text size="xs" weight="medium" tone={tone ?? (variant === "primary" ? "onPrimary" : variant === "outline" ? "muted" : "foreground")}>
        {label}
      </Text>
    </View>
  );
}
