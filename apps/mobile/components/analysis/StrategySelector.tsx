import { Pressable, View } from "react-native";
import type { NormalizedStrategy } from "@optionpilot/shared";
import { CaretUpDownIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { ViewTag } from "./ViewTag";

/** The card that shows the open strategy and opens the picker. */
export function StrategySelector({ strategy, onPress }: { strategy: NormalizedStrategy; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Strategy: ${strategy.name}. Change strategy`}
      onPress={onPress}
      className="h-[52px] flex-row items-center gap-3 rounded-xl border border-border bg-card px-4"
    >
      <Text weight="semibold" numberOfLines={1} className="shrink">
        {strategy.name}
      </Text>
      <ViewTag view={strategy.category} />
      <View className="flex-1 items-end">
        <CaretUpDownIcon size={20} weight="bold" color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}
