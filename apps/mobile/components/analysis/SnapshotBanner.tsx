import { View } from "react-native";
import { ClockCounterClockwiseIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { formatHistoryTime } from "@/lib/history/model";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** Above a saved analysis opened from History: when it was saved, and that its prices are not live. */
export function SnapshotBanner({ savedAt }: { savedAt: string }) {
  const { colors } = useTheme();
  const when = formatHistoryTime(savedAt);
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`Saved snapshot, ${when}, prices as saved, not live`}
      className="flex-row items-center gap-2.5 rounded-xl bg-accent px-3.5 py-[7px]"
    >
      <ClockCounterClockwiseIcon size={20} weight="bold" color={colors.mutedForeground} />
      <View className="flex-1">
        <Text size="sm" weight="medium">
          Saved snapshot
        </Text>
        <Text size="xs" tone="muted">
          {when} · prices as saved, not live
        </Text>
      </View>
    </View>
  );
}
