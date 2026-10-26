import { useState } from "react";
import { Pressable, View } from "react-native";
import { ArrowRightIcon, CheckIcon, XIcon } from "@/components/icons";
import { Tag, Text } from "@/components/ui";
import type { RankedRow } from "@/lib/analysis/recommend";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme/ThemeProvider";

type RankedListProps = { rows: RankedRow[]; onShowPayoff: (key: string) => void };

/** The top strategies by rank. Tapping a row opens its score bar and the reasons behind it. */
export function RankedList({ rows, onShowPayoff }: RankedListProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      {rows.map((row, index) => {
        const expanded = open === row.key;
        return (
          <View key={row.key} className={cn(index > 0 && "border-t border-border")}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={`${row.position} ${row.name}, ${row.viable ? "viable" : "not viable"}, score ${row.score.toFixed(0)}`}
              onPress={() => setOpen(expanded ? null : row.key)}
              className="min-h-[56px] flex-row items-center gap-3 px-4 py-3"
            >
              <Text size="xs" mono tone="faint">
                {row.position}
              </Text>
              <Text size="sm" numberOfLines={1} className="flex-1">
                {row.name}
              </Text>
              <Tag variant="outline" tone={row.viable ? "profit" : "loss"} icon={row.viable ? CheckIcon : XIcon} label={row.viable ? "Viable" : "Not viable"} />
              <Text size="sm" mono className="w-8 text-right">
                {row.score.toFixed(0)}
              </Text>
            </Pressable>
            {expanded ? (
              <View className="gap-2 px-4 pb-4">
                <View className="h-1 overflow-hidden rounded-full bg-accent">
                  <View className="h-1 rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, row.score))}%` }} />
                </View>
                {row.reasons.map((reason) => (
                  <View key={reason} className="flex-row gap-2">
                    <Text size="sm" tone="muted">
                      •
                    </Text>
                    <Text size="sm" tone="muted" className="flex-1">
                      {reason}
                    </Text>
                  </View>
                ))}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Show payoff for ${row.name}`}
                  onPress={() => onShowPayoff(row.key)}
                  hitSlop={8}
                  className="min-h-[32px] flex-row items-center gap-1"
                >
                  <Text size="sm" weight="medium">
                    Show payoff
                  </Text>
                  <ArrowRightIcon size={16} weight="bold" color={colors.foreground} />
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
