import { View } from "react-native";
import { ArrowDownIcon, SpinnerGapIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** How far the list has to be pulled down, in points, before letting go refreshes. */
export const PULL_THRESHOLD = 72;

type PullHintProps = { distance: number; refreshing: boolean };

/** The words and arrow under the nav while the Terminal is pulled down. */
export function PullHint({ distance, refreshing }: PullHintProps) {
  const { colors } = useTheme();
  if (!refreshing && distance <= 0) return null;
  const ready = distance >= PULL_THRESHOLD;
  const Icon = refreshing ? SpinnerGapIcon : ArrowDownIcon;
  const text = refreshing ? "Refreshing prices" : ready ? "Release to refresh prices" : "Pull to refresh prices";
  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      className="h-[72px] items-center justify-center gap-1"
      style={{ opacity: refreshing ? 1 : Math.min(1, distance / PULL_THRESHOLD) }}
    >
      <View style={{ transform: [{ rotate: ready && !refreshing ? "180deg" : "0deg" }] }}>
        <Icon size={24} weight="bold" color={colors.primary} />
      </View>
      <Text size="xs" tone="muted">
        {text}
      </Text>
    </View>
  );
}
