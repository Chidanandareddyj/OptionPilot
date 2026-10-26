import { useState } from "react";
import { View } from "react-native";
import type { NormalizedStrategy } from "@optionpilot/shared";
import { PayoffChart } from "@/components/chart/PayoffChart";
import { HandPointingIcon } from "@/components/icons";
import { Card, Text } from "@/components/ui";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** The chart card, with the hint under it that switches while a finger is reading the chart. */
export function PayoffCard({ strategy, spot }: { strategy: NormalizedStrategy; spot: number }) {
  const { colors } = useTheme();
  const [scrubbing, setScrubbing] = useState(false);
  return (
    <Card className="pb-3 pt-2">
      <PayoffChart strategy={strategy} spot={spot} onScrubChange={setScrubbing} />
      <View className="flex-row items-center gap-2 px-4 pt-3">
        <HandPointingIcon size={16} weight="bold" color={colors.mutedForeground} />
        <Text size="xs" tone="muted">
          {scrubbing ? "Dragging to read any price" : "Drag to read any price. Pinch to zoom."}
        </Text>
      </View>
    </Card>
  );
}
