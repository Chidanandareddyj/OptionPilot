import { View } from "react-native";
import { ArrowDownIcon, SpinnerGapIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** How far the list has to be pulled down, in points, before letting go refreshes. */
export const PULL_THRESHOLD = 56;

type PullHintProps = {
  distance: number;
  refreshing: boolean;
  /** What gets refreshed, as in "Pull to refresh prices". Empty for "Pull to refresh". */
  subject?: string;
};

/** The words and arrow under the nav while the Terminal is pulled down. */
export function PullHint({ distance, refreshing, subject = "prices" }: PullHintProps) {
  const { colors } = useTheme();
  if (!refreshing && distance <= 0) return null;
  const ready = distance >= PULL_THRESHOLD;
  const Icon = refreshing ? SpinnerGapIcon : ArrowDownIcon;
  const what = subject ? ` ${subject}` : "";
  const text = refreshing ? `Refreshing${what}` : ready ? `Release to refresh${what}` : `Pull to refresh${what}`;
  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      className="h-[72px] items-center justify-center gap-1"
      style={{ opacity: refreshing ? 1 : Math.min(1, distance / PULL_THRESHOLD) }}
    >
      <Icon size={24} weight="bold" color={colors.primary} />
      <Text size="xs" tone="muted">
        {text}
      </Text>
    </View>
  );
}
