import { Pressable, View } from "react-native";
import { CaretDownIcon, CaretUpIcon } from "@/components/icons";
import { Skeleton, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import { money, signedPercent } from "@/lib/analysis/format";
import type { QuoteRowData } from "@/lib/market/recent";
import { useTheme } from "@/lib/theme/ThemeProvider";

type RecentSymbolsProps = {
  rows: QuoteRowData[];
  /** True until the first prices arrive, so the rows show placeholders instead of dashes. */
  loading: boolean;
  /** Set when the index prices are the server's saved ones, not a live quote. */
  approximate: boolean;
  onSelect: (symbol: string) => void;
};

function Change({ value }: { value: number | null }) {
  const { colors } = useTheme();
  if (value === null) {
    return (
      <Text size="sm" mono tone="faint">
        —
      </Text>
    );
  }
  const up = value >= 0;
  const color = up ? colors.profit : colors.loss;
  const Caret = up ? CaretUpIcon : CaretDownIcon;
  return (
    <View className="flex-row items-center gap-1">
      <Caret size={12} weight="fill" color={color} />
      <Text size="sm" mono tone={up ? "profit" : "loss"}>
        {signedPercent(value)}
      </Text>
    </View>
  );
}

/** Indices and the stocks you looked at last, with their prices. Tapping a row starts an analysis of it. */
export function RecentSymbols({ rows, loading, approximate, onSelect }: RecentSymbolsProps) {
  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <Text size="sm" weight="medium" tone="muted">
          Recent symbols
        </Text>
        <Text size="xs" mono tone="faint">
          {rows.length}
        </Text>
      </View>
      <View className="overflow-hidden rounded-2xl border border-border bg-card">
        {rows.map((row, index) => (
          <Pressable
            key={row.symbol}
            accessibilityRole="button"
            accessibilityLabel={`Analyze ${row.symbol}`}
            onPress={() => onSelect(row.symbol)}
            className={cn("min-h-[52px] flex-row items-center gap-3 px-4 py-3", index > 0 && "border-t border-border")}
          >
            <Text weight="semibold" className="flex-1">
              {row.symbol}
            </Text>
            {loading && row.price === null ? (
              <Skeleton width={72} height={16} />
            ) : (
              <Text mono tone={row.price === null ? "faint" : "foreground"}>
                {row.price === null ? "—" : money(row.price)}
              </Text>
            )}
            <View className="w-[84px] items-end">
              {loading && row.percentChange === null ? <Skeleton width={56} height={14} /> : <Change value={row.percentChange} />}
            </View>
          </Pressable>
        ))}
      </View>
      {approximate ? (
        <Text size="xs" tone="faint" className="mt-2 px-1">
          Index levels are approximate right now. Live quotes are not available.
        </Text>
      ) : null}
    </View>
  );
}
