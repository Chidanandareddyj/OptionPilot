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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${row.position} ${row.name}, ${row.roi}, ${cost.label} ${cost.value}, ${profit.label} ${profit.value}, ${loss.label} ${loss.value}`}
      accessibilityHint="Loads this payoff"
      onPress={onPress}
      className={cn("gap-3 rounded-2xl border border-border p-4", selected ? "bg-accent" : "bg-card")}
    >
      <View className="flex-row items-baseline justify-between gap-2">
        <View className="flex-1 flex-row items-baseline gap-2">
          <Text size="sm" mono tone="faint">
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

      <View className="flex-row items-center gap-2 pl-6">
        <ViewTag view={row.strategy.category} />
        <Text size="xs" mono tone="muted" numberOfLines={1} className="min-w-0 shrink">
          {row.strikes}
        </Text>
        <View className="flex-1 items-end">
          <Sparkline strategy={row.strategy} width={64} height={24} />
        </View>
      </View>

      <View className="flex-row justify-between">
        {row.stats.map((stat, index) => (
          <View key={stat.label} className={cn("gap-0.5", index === 1 && "items-center", index === 2 && "items-end")}>
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
