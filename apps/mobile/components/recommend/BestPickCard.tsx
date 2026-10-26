import { Pressable, View } from "react-native";
import { ArrowRightIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import type { BestPick } from "@/lib/analysis/recommend";
import { useTheme } from "@/lib/theme/ThemeProvider";

type BestPickCardProps = { pick: BestPick; onShowPayoff: () => void };

/** The recommended strategy: name and score, then POP, EV, max loss, max profit and lot size. */
export function BestPickCard({ pick, onShowPayoff }: BestPickCardProps) {
  const { colors } = useTheme();
  return (
    <View
      className="gap-3 rounded-2xl border border-primary bg-accent p-4"
      accessible={false}
      style={{ shadowColor: colors.primary, shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text size="xs" tone="muted">
            {pick.caption}
          </Text>
          <Text size="2xl" weight="semibold" tight accessibilityRole="header">
            {pick.name}
          </Text>
        </View>
        <View className="items-end" accessible accessibilityLabel={`Score ${pick.score}`}>
          <Text size="3xl" mono tone="primary" weight="medium">
            {pick.score}
          </Text>
          <Text size="xs" tone="muted">
            score
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
        {pick.figures.map((figure) => (
          <Text key={figure.label} size="sm" tone="muted">
            {figure.label}{" "}
            <Text size="sm" mono tone={figure.tone ?? "foreground"}>
              {figure.value}
            </Text>
          </Text>
        ))}
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel={`Show payoff for ${pick.name}`} onPress={onShowPayoff} hitSlop={8} className="min-h-[32px] flex-row items-center gap-1">
        <Text size="sm" weight="medium" tone="foreground">
          Show payoff
        </Text>
        <ArrowRightIcon size={16} weight="bold" color={colors.foreground} />
      </Pressable>
    </View>
  );
}
