import { View } from "react-native";
import { ChartLineUpIcon, ClockCounterClockwiseIcon } from "@/components/icons";
import { Button, Text } from "@/components/ui";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** What History says before anything is saved. */
export function HistoryEmpty({ onOpenTerminal }: { onOpenTerminal: () => void }) {
  const { colors } = useTheme();
  return (
    <View className="items-center px-6 pt-[104px]">
      <View className="h-16 w-16 items-center justify-center rounded-xl bg-accent">
        <ClockCounterClockwiseIcon size={32} weight="bold" color={colors.mutedForeground} />
      </View>
      <Text size="xl" weight="semibold" className="mt-4">
        No saved analyses
      </Text>
      <Text tone="muted" className="mt-2 text-center">
        Analyze a symbol and it will show up here.
      </Text>
      <Button label="Open the terminal" variant="primary" icon={ChartLineUpIcon} onPress={onOpenTerminal} className="mt-5" />
    </View>
  );
}
