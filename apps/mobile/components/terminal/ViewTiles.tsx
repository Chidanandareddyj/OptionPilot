import { ScrollView, View } from "react-native";
import { VIEW_ICON } from "@/components/analysis/ViewTag";
import { Card, Text } from "@/components/ui";
import { strategyCountsByView, VIEW_LABEL, VIEW_ORDER } from "@/lib/analysis/model";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** How many of the 12 strategies suit each market view. Four tiles do not fit across a phone, so the row scrolls sideways like the design's. */
export function ViewTiles() {
  const { colors } = useTheme();
  const counts = strategyCountsByView();
  return (
    <View>
      <Text size="sm" weight="medium" tone="muted" className="mb-2">
        Browse by view
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4" contentContainerClassName="gap-2 px-4">
        {VIEW_ORDER.map((view) => {
          const Icon = VIEW_ICON[view];
          return (
            <Card key={view} className="w-[120px] gap-2 p-4" accessible accessibilityLabel={`${VIEW_LABEL[view]}, ${counts[view]} strategies`}>
              <Icon size={24} weight="bold" color={colors.mutedForeground} />
              <View>
                <Text weight="semibold" numberOfLines={1}>
                  {VIEW_LABEL[view]}
                </Text>
                <Text size="xs" tone="muted">
                  {counts[view]} strategies
                </Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}
