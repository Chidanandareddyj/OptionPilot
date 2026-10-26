import { Pressable, View } from "react-native";
import { ViewTag } from "@/components/analysis/ViewTag";
import { Sparkline } from "@/components/chart/Sparkline";
import { Text } from "@/components/ui";
import type { CompareRow } from "@/lib/analysis/compare";
import { cn } from "@/lib/cn";

type CompareRowCardProps = { row: CompareRow; selected: boolean; onPress: () => void };

/** One strategy in the comparison: its place, name and ROI, the view and strikes with a sparkline, then cost, max profit and max loss. */
export function CompareRowCard({ row, selected, onPress }: CompareRowCardProps) {
  const [cost, profit, loss] = row.stats;
  const roomy = row.strikes.split(" / ").length <= 3;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${row.position} ${row.name}, ${row.roi}, ${cost.label} ${cost.value}, ${profit.label} ${profit.value}, ${loss.label} ${loss.value}`}
      accessibilityHint="Loads this payoff"
      onPress={onPress}
      className={cn("gap-3 rounded-2xl border border-border px-4 py-3", selected ? "bg-accent" : "bg-card")}
    >
      <View className="flex-row items-baseline justify-between gap-2">
        <View className="flex-1 flex-row items-baseline gap-2">
          <Text size="sm" mono tone="faint" className="w-7">
            {row.position}
          </Text>
          <Text weight="semibold" numberOfLines={1} className="shrink">
            {row.name}
          </Text>
        </View>
        <Text size="sm" mono weight="medium">
          {row.roi}
        </Text>
      </View>

      {/* Strike lists of four fit only without the indent, as in the design's Call Condor row. */}
      <View className={cn("flex-row items-center gap-2", roomy && "pl-9")}>
        <View className="shrink-0">
          <ViewTag view={row.strategy.category} />
        </View>
        <Text size="xs" mono tone="muted" numberOfLines={1} className="min-w-0 flex-1" style={roomy ? undefined : { fontSize: 11 }}>
          {row.strikes}
        </Text>
        <View className="shrink-0">
          <Sparkline strategy={row.strategy} width={roomy ? 64 : 52} height={24} />
        </View>
      </View>

      <View className="flex-row justify-between">
        {row.stats.map((stat, index) => (
          <View key={stat.label} className={cn("gap-0", index === 1 && "items-center", index === 2 && "items-end")}>
            <Text size="xs" tone="muted">
              {stat.label}
            </Text>
            <Text size="sm" mono tone={stat.tone ?? "foreground"}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}
