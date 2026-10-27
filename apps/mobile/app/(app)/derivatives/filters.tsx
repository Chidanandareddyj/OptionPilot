import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { applyView, evaluateBoard, type BoardView } from "@optionpilot/shared";
import { RupeeInput } from "@/components/derivatives/RupeeInput";
import { XIcon } from "@/components/icons";
import { Button, SegmentedControl, Text } from "@/components/ui";
import { useBoardState } from "@/lib/derivatives/BoardState";
import { useLiveFeed } from "@/lib/derivatives/FeedProvider";
import { resetFilters, strategySegments } from "@/lib/derivatives/model";
import { useScreenInsets } from "@/lib/safe-area";
import { useTheme } from "@/lib/theme/ThemeProvider";

const INVESTMENT: { value: BoardView["investment"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
];

/** The Filters form sheet over the board. Every change applies at once, and the button counts what is left. */
export default function FiltersSheet() {
  const router = useRouter();
  const insets = useScreenInsets();
  const { colors } = useTheme();
  const { strategy, setStrategy, view, setView } = useBoardState();
  const { companies, feed } = useLiveFeed();
  const patch = (update: Partial<BoardView>) => setView((v) => ({ ...v, ...update }));

  const matches = useMemo(() => applyView(evaluateBoard(companies, feed, strategy).evaluations, view).length, [companies, feed, strategy, view]);

  return (
    <View className="bg-card px-4 pt-6" style={{ paddingBottom: Math.max(insets.bottom, 24) + 8 }}>
      <View className="mb-4 flex-row items-center">
        <Text size="2xl" weight="semibold" tight accessibilityRole="header" className="flex-1">
          Filters
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={8}
          className="h-8 w-8 items-center justify-center rounded-full border border-border bg-card"
        >
          <XIcon size={16} weight="bold" color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets scrollEnabled={false} contentContainerClassName="gap-4">
        <View className="gap-2">
          <Text size="sm" weight="medium">
            Strategy
          </Text>
          <SegmentedControl tone="primary" segments={strategySegments(strategy)} value={strategy} onChange={setStrategy} />
        </View>

        <View className="gap-2">
          <Text size="sm" weight="medium">
            Investment
          </Text>
          <SegmentedControl tone="primary" segments={INVESTMENT} value={view.investment} onChange={(investment) => patch({ investment })} />
        </View>

        <View className="flex-row gap-3">
          <RupeeInput label="Min" placeholder="0" value={view.min} onChange={(min) => patch({ min })} />
          <RupeeInput label="Max" placeholder="No limit" value={view.max} onChange={(max) => patch({ max })} />
        </View>

        <View className="h-9 flex-row items-center justify-between">
          <Text size="sm" weight="medium">
            Show stale rows
          </Text>
          <Switch
            accessibilityLabel="Show stale rows"
            value={!view.hideStale}
            onValueChange={(on) => patch({ hideStale: !on })}
            trackColor={{ false: colors.accent, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>

        <Button
          label={`Show ${matches} ${matches === 1 ? "contract" : "contracts"}`}
          variant="primary"
          onPress={() => router.back()}
        />
        <Button label="Reset filters" variant="quiet" onPress={() => setView((v) => ({ ...resetFilters(v), search: v.search }))} />
      </ScrollView>
    </View>
  );
}
