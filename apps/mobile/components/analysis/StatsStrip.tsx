import { ScrollView, View } from "react-native";
import { Card, Text } from "@/components/ui";
import type { Stat } from "@/lib/analysis/model";

/** Max profit, max loss and the rest, in a row that scrolls sideways. */
export function StatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-4"
      // Pull the strip out to the screen edges: the page itself has a 16 px gutter.
      className="-mx-4"
    >
      {stats.map((stat) => (
        <Card key={stat.label} className="min-w-[136px] gap-1 px-4 py-3" accessible accessibilityLabel={`${stat.label}, ${stat.value}`}>
          <Text size="xs" tone="muted">
            {stat.label}
          </Text>
          <View>
            <Text size="xl" mono weight="medium" tone={stat.tone ?? "foreground"}>
              {stat.value}
            </Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}
