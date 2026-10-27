import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { VIEW_ICON } from "@/components/analysis/ViewTag";
import { Card, Text } from "@/components/ui";
import { strategyCountsByView, VIEW_LABEL, VIEW_ORDER } from "@/lib/analysis/model";
import { VIEW_STRATEGY } from "@/lib/derivatives/model";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** How many of the 12 strategies suit each market view. Four tiles do not fit across a phone, so the row scrolls sideways like the design's. A tile opens the live Derivatives board on that view's strategy. */
export function ViewTiles() {
  const { colors } = useTheme();
  const router = useRouter();
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
            <Pressable
              key={view}
              accessibilityRole="button"
              accessibilityLabel={`${VIEW_LABEL[view]}, ${counts[view]} strategies`}
              accessibilityHint="Opens live derivatives for this view"
              onPress={() => router.navigate({ pathname: "/derivatives", params: { strategy: VIEW_STRATEGY[view], at: String(Date.now()) } })}
            >
              <Card className="w-[120px] gap-2 p-4">
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
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
