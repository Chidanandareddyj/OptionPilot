import { Pressable, View } from "react-native";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { CaretRightIcon, type PhosphorIcon } from "@/components/icons";
import { Text } from "./Text";

/** A bordered group of rows. Rows draw their own divider above themselves. */
export function ListGroup({ children }: { children: React.ReactNode }) {
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">{children}</View>
  );
}

type ListRowProps = {
  icon: PhosphorIcon;
  label: string;
  value?: string;
  /** Hide the divider above the first row. */
  first?: boolean;
  /** A destructive action such as sign out: red label and icon, no chevron. */
  danger?: boolean;
  onPress?: () => void;
};

export function ListRow({ icon: IconComponent, label, value, first = false, danger = false, onPress }: ListRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      className={cn("min-h-14 flex-row items-center gap-3 px-4 py-3", !first && "border-t border-border")}
    >
      <IconComponent size={24} color={danger ? colors.loss : colors.mutedForeground} />
      <Text className="flex-1" tone={danger ? "loss" : "foreground"}>
        {label}
      </Text>
      {value ? (
        <Text size="sm" tone="muted">
          {value}
        </Text>
      ) : null}
      {danger ? null : <CaretRightIcon size={16} weight="bold" color={colors.faint} />}
    </Pressable>
  );
}
