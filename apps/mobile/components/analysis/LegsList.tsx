import { View } from "react-native";
import { Card, Tag, Text } from "@/components/ui";
import { signed } from "@/lib/analysis/format";
import { netCashFlow, type LegCard } from "@/lib/analysis/model";

function Fact({ label, value, align = "start", tone }: { label: string; value: string; align?: "start" | "end"; tone?: "profit" | "loss" }) {
  return (
    <View className={align === "end" ? "items-end" : undefined}>
      <Text size="xs" tone="muted">
        {label}
      </Text>
      <Text size="lg" mono tone={tone ?? "foreground"}>
        {value}
      </Text>
    </View>
  );
}

/** One card per leg of the strategy, then the net cash flow of the whole position. */
export function LegsList({ cards }: { cards: LegCard[] }) {
  const net = netCashFlow(cards);
  return (
    <View className="gap-2">
      {cards.map((card) => (
        <Card key={`${card.title}-${card.strike}`} className="gap-3 p-4">
          <View className="flex-row items-center justify-between">
            <Text weight="semibold">{card.title}</Text>
            <Tag label={card.action} variant="outline" />
          </View>
          <View className="flex-row justify-between">
            <Fact label="Strike" value={card.strike} />
            <Fact label="Premium" value={card.premium} />
            <Fact label="Quantity" value={card.quantity} />
            <Fact label="Cash flow" value={signed(card.cashFlow)} align="end" tone={card.cashFlow >= 0 ? "profit" : "loss"} />
          </View>
        </Card>
      ))}
      <View className="flex-row items-center justify-between rounded-2xl border border-border bg-accent p-4">
        <Text weight="semibold">{net < 0 ? "Net debit" : "Net credit"}</Text>
        <Text size="lg" mono weight="medium" tone={net < 0 ? "loss" : "profit"}>
          {signed(net)}
        </Text>
      </View>
    </View>
  );
}
