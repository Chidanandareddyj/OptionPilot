import { View } from "react-native";
import { Tag, Text, type TextProps } from "@/components/ui";
import { cn } from "@/lib/cn";
import { signed, signedPercent } from "@/lib/analysis/format";
import type { PayoffTableRow } from "@/lib/analysis/model";
import { price } from "@optionpilot/shared";

const toneOf = (value: number): TextProps["tone"] => (value > 0 ? "profit" : value < 0 ? "loss" : "foreground");

/** P&L per lot and ROI at every price of the expiry table, with the row nearest spot marked. */
export function PayoffTable({ rows }: { rows: PayoffTableRow[] }) {
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <View className="h-10 flex-row items-center border-b border-border px-4">
        <Text size="xs" tone="muted" className="w-[128px]">
          Price at expiry
        </Text>
        <Text size="xs" tone="muted" className="flex-1 text-right">
          P&L per lot
        </Text>
        <Text size="xs" tone="muted" className="w-[96px] text-right">
          ROI
        </Text>
      </View>
      {rows.map((row) => (
        <View
          key={row.price}
          accessible
          accessibilityLabel={`At ${price(row.price)}${row.isSpot ? ", spot" : ""}, ${signed(row.pnl)} profit or loss${row.roi === null ? "" : `, ROI ${signedPercent(row.roi, 1)}`}`}
          className={cn("h-11 flex-row items-center px-4", row.isSpot && "bg-accent")}
        >
          <View className="w-[128px] flex-row items-center gap-2">
            <Text size="sm" mono>
              {price(row.price)}
            </Text>
            {row.isSpot ? <Tag label="Spot" variant="primary" /> : null}
          </View>
          <Text size="sm" mono tone={toneOf(row.pnl)} className="flex-1 text-right">
            {row.pnl === 0 ? "0" : signed(row.pnl)}
          </Text>
          <Text size="sm" mono tone={row.roi === null ? "faint" : toneOf(row.roi)} className="w-[96px] text-right">
            {row.roi === null ? "—" : row.roi === 0 ? "0.0%" : signedPercent(row.roi, 1)}
          </Text>
        </View>
      ))}
    </View>
  );
}
