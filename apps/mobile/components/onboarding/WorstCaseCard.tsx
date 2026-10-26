import { View } from "react-native";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { WarningCircleIcon } from "@/components/icons";
import { Text } from "@/components/ui";

function Stat({ label, value, tone, align }: { label: string; value: string; tone?: "profit"; align?: "end" }) {
  return (
    <View className={align === "end" ? "items-end" : undefined}>
      <Text size="xs" tone="faint">
        {label}
      </Text>
      <Text size="xl" weight="medium" mono tone={tone}>
        {value}
      </Text>
    </View>
  );
}

/** Sample numbers for a bull call spread on RELIANCE, shown on the second intro slide. */
export function WorstCaseCard() {
  const { colors } = useTheme();
  return (
    <View className="gap-4 px-2 pb-2 pt-4">
      <View className="flex-row items-center gap-2">
        <WarningCircleIcon size={20} weight="bold" color={colors.mutedForeground} />
        <Text size="sm" weight="medium" tone="muted">
          Worst case, one lot of 500
        </Text>
      </View>
      <View className="flex-row items-baseline gap-2">
        <Text size="5xl" weight="medium" mono tone="loss">
          −4,300
        </Text>
        <Text mono tone="muted">
          Max loss
        </Text>
      </View>
      <View className="h-px bg-border" />
      <View className="flex-row justify-between">
        <Stat label="Max profit" value="+5,700" tone="profit" />
        <Stat label="Breakeven" value="1,188.60" />
        <Stat label="Risk to reward" value="1 : 1.33" align="end" />
      </View>
    </View>
  );
}
