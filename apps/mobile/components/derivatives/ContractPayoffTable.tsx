import { View } from "react-native";
import { price, signedInr } from "@optionpilot/shared";
import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ContractPayoffRow } from "@/lib/derivatives/detail";

/** Net profit or loss per lot at each closing price, with the row nearest spot shaded. */
export function ContractPayoffTable({ rows }: { rows: ContractPayoffRow[] }) {
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <View className="h-11 flex-row items-center border-b border-border px-4">
        <Text size="sm" tone="muted" className="flex-1">
          Closing price
        </Text>
        <Text size="sm" tone="muted" className="flex-1 text-right">
          Net P&L per lot
        </Text>
      </View>
      {rows.map((row) => (
        <View
          key={row.price}
          accessible
          accessibilityLabel={`At ${price(row.price, 2)}${row.nearest ? ", nearest spot" : ""}, ${signedInr(row.pnl)} per lot`}
          className={cn("h-10 flex-row items-center px-4", row.nearest && "bg-accent")}
        >
          <Text mono className="flex-1">
            {price(row.price, 2)}
          </Text>
          <Text mono tone={row.pnl > 0 ? "profit" : row.pnl < 0 ? "loss" : "foreground"} className="flex-1 text-right">
            {row.pnl === 0 ? "0" : signedInr(row.pnl).replace("₹", "")}
          </Text>
        </View>
      ))}
    </View>
  );
}
