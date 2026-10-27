import { View } from "react-native";
import { Card, Skeleton, Text } from "@/components/ui";
import { SpinnerGapIcon } from "@/components/icons";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** The shape of the analysis while it loads: placeholders for the selector, the switcher, the chart and the stats. */
export function AnalysisSkeleton({ symbol, label = "Calculating…" }: { symbol?: string; label?: string }) {
  const { colors } = useTheme();
  return (
    <View accessibilityLabel={label} accessibilityLiveRegion="polite">
      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <SpinnerGapIcon size={20} weight="bold" color={colors.mutedForeground} />
          <Text size="sm" tone="muted">
            {label}
          </Text>
        </View>
        {symbol ? (
          <Text size="4xl" weight="semibold" tight accessibilityRole="header">
            {symbol}
          </Text>
        ) : (
          <Skeleton width={180} height={40} />
        )}
      </View>
      <View className="mt-4 gap-4">
        <Skeleton height={52} radius={12} />
        <Skeleton height={52} radius={12} />
        <Card className="p-4">
          <Skeleton width="60%" height={16} />
          <View className="h-3" />
          <Skeleton height={200} radius={12} />
        </Card>
        <View className="flex-row gap-2">
          <Skeleton width="auto" height={72} radius={16} style={{ flex: 1 }} />
          <Skeleton width="auto" height={72} radius={16} style={{ flex: 1 }} />
          <Skeleton width="auto" height={72} radius={16} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}
