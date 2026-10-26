import { memo } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui";
import type { ContractCard as Card } from "@/lib/derivatives/model";
import { cn } from "@/lib/cn";

type ContractCardProps = { card: Card; onPress: (key: string) => void };

/** One contract on the board: symbol and profit to risk, the contract in one line, then profit, loss and breakeven. Stale rows are faded. */
export const ContractCard = memo(function ContractCard({ card, onPress }: ContractCardProps) {
  const label = `${card.symbol}, profit to risk ${card.roi}${card.stale ? ", stale" : ""}, ${card.stats.map((s) => `${s.label} ${s.value}`).join(", ")}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Opens the payoff"
      onPress={() => onPress(card.key)}
      className={cn("gap-3 rounded-2xl border border-border bg-card px-4 py-4", card.stale && "opacity-60")}
    >
      <View>
        <View className="flex-row items-baseline justify-between gap-2">
          <Text size="xl" weight="semibold" numberOfLines={1} className="shrink">
            {card.symbol}
          </Text>
          <View className="flex-row items-baseline gap-2">
            <Text size="xl" mono weight="medium">
              {card.roi}
            </Text>
            <Text size="xs" tone="muted">
              Profit to risk
            </Text>
          </View>
        </View>
        <Text size="xs" mono tone="muted" numberOfLines={1} className="mt-0.5">
          {card.meta}
        </Text>
      </View>
      <View className="flex-row justify-between">
        {card.stats.map((stat, index) => (
          <View key={stat.label} className={cn(index === 1 && "items-center", index === 2 && "items-end")}>
            <Text size="xs" tone="muted">
              {stat.label}
            </Text>
            <Text size="sm" mono weight="medium" tone={stat.tone ?? "foreground"}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
});
