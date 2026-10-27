import { Pressable, View } from "react-native";
import type { Category } from "@optionpilot/shared";
import { VIEW_ICON } from "@/components/analysis/ViewTag";
import { Text } from "@/components/ui";
import { VIEW_LABEL, VIEW_ORDER } from "@/lib/analysis/model";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme/ThemeProvider";

type ViewPickerProps = { value: Category; onChange: (view: Category) => void; disabled?: boolean };

/** Bullish, Bearish, Neutral or Volatile: which way the market is expected to go. Four tiles in a row. */
export function ViewPicker({ value, onChange, disabled = false }: ViewPickerProps) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="radiogroup" className="gap-2">
      <Text size="sm" weight="medium">
        View
      </Text>
      <View className="flex-row gap-2">
        {VIEW_ORDER.map((view) => {
          const Icon = VIEW_ICON[view];
          const selected = view === value;
          return (
            <Pressable
              key={view}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={VIEW_LABEL[view]}
              disabled={disabled}
              onPress={() => onChange(view)}
              className={cn(
                "h-[62px] flex-1 items-center justify-center gap-1 rounded-xl border",
                selected ? "border-transparent bg-primary" : "border-border bg-card",
              )}
            >
              <Icon size={22} weight="bold" color={selected ? colors.primaryForeground : colors.mutedForeground} />
              <Text size="xs" weight="medium" tone={selected ? "onPrimary" : "muted"} numberOfLines={1}>
                {VIEW_LABEL[view]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
