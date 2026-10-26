import { View } from "react-native";
import { Text } from "@/components/ui";
import { money } from "@/lib/analysis/format";
import type { AnalysisHeader as Header } from "@/lib/analysis/model";

/** Symbol, spot, and the ATM strike, expiry and lot size under them. */
export function AnalysisHeader({ header }: { header: Header }) {
  const facts = [
    header.atm === null ? null : `ATM ${header.atm.toLocaleString("en-IN")}`,
    header.expiry ? `Expiry ${header.expiry}` : null,
    `Lot ${header.lotSize.toLocaleString("en-IN")}`,
  ].filter((fact): fact is string => fact !== null);

  return (
    <View>
      <View className="flex-row items-end justify-between">
        <View className="shrink">
          <Text size="xs" tone="muted">
            NSE F&O · option chain
          </Text>
          <Text size="4xl" weight="semibold" tight accessibilityRole="header" numberOfLines={1}>
            {header.symbol}
          </Text>
        </View>
        <View className="items-end">
          <Text size="xs" tone="muted">
            Spot
          </Text>
          <Text size="2xl" mono weight="medium">
            ₹{money(header.spot)}
          </Text>
        </View>
      </View>
      <View className="mt-1 flex-row flex-wrap items-center gap-x-2">
        {facts.map((fact, index) => (
          <View key={fact} className="flex-row items-center gap-2">
            {index > 0 ? (
              <Text size="sm" mono tone="faint">
                ·
              </Text>
            ) : null}
            <Text size="sm" mono tone="muted">
              {fact}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
