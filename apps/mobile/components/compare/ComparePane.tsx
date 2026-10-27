import { View } from "react-native";
import type { NormalizedStrategy } from "@optionpilot/shared";
import { ViewTag } from "@/components/analysis/ViewTag";
import { PayoffChart } from "@/components/chart/PayoffChart";
import { Card, Text } from "@/components/ui";

type ComparePaneProps = { strategy: NormalizedStrategy; spot: number };

/** One of the two views side by side: its view and strategy, over a compact payoff chart. */
export function ComparePane({ strategy, spot }: ComparePaneProps) {
  return (
    <Card className="gap-2 p-2" accessible={false}>
      <View className="flex-row items-center gap-2 px-2 pt-1">
        <ViewTag view={strategy.category} />
        <Text weight="semibold" numberOfLines={1} className="flex-1">
          {strategy.name}
        </Text>
      </View>
      <View className="overflow-hidden rounded-xl bg-background">
        <PayoffChart strategy={strategy} spot={spot} compact />
      </View>
    </Card>
  );
}
