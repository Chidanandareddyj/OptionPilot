import { ActivityIndicator, Pressable, View, type PressableProps } from "react-native";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme/ThemeProvider";
import type { PhosphorIcon } from "@/components/icons";
import { Text, type TextTone } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "quiet" | "danger";
export type ButtonSize = "lg" | "sm";

const containerClass: Record<ButtonVariant, string> = {
  primary: "bg-primary border-transparent",
  secondary: "bg-accent border-transparent",
  ghost: "bg-transparent border-border",
  quiet: "bg-transparent border-transparent",
  danger: "bg-transparent border-border",
};

const toneByVariant: Record<ButtonVariant, TextTone> = {
  primary: "onPrimary",
  secondary: "foreground",
  ghost: "foreground",
  quiet: "muted",
  danger: "loss",
};

const sizeClass: Record<ButtonSize, string> = {
  lg: "h-[52px] rounded-xl px-4",
  sm: "h-[44px] rounded-lg px-3",
};

export type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** A Phosphor icon drawn before the label. */
  icon?: PhosphorIcon;
  loading?: boolean;
  className?: string;
};

export function Button({
  label,
  variant = "secondary",
  size = "lg",
  icon: IconComponent,
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const inactive = Boolean(disabled) || loading;
  const iconColor = {
    primary: colors.primaryForeground,
    secondary: colors.foreground,
    ghost: colors.foreground,
    quiet: colors.mutedForeground,
    danger: colors.loss,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      className={cn(
        "flex-row items-center justify-center gap-2 border",
        containerClass[variant],
        sizeClass[size],
        inactive && "opacity-70",
        className,
      )}
      style={({ pressed }) => (pressed ? { transform: [{ scale: 0.98 }] } : undefined)}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : IconComponent ? (
        <View>
          <IconComponent size={20} weight="bold" color={iconColor} />
        </View>
      ) : null}
      <Text
        size={size === "lg" ? "base" : "sm"}
        weight="semibold"
        tone={toneByVariant[variant]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
