import { useRouter } from "expo-router";
import { useMemo, type ReactNode } from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { applyView, evaluateBoard, type BoardView } from "@optionpilot/shared";
import { EyeSlashIcon, XIcon } from "@/components/icons";
import { RupeeInput } from "@/components/derivatives/RupeeInput";
import { SortChips } from "@/components/derivatives/SortChips";
import { StrategySwitcher } from "@/components/derivatives/StrategySwitcher";
import { Button, SegmentedControl, Text } from "@/components/ui";
import { useBoardState } from "@/lib/derivatives/BoardState";
import { useLiveFeed } from "@/lib/derivatives/FeedProvider";
import { cycleSort, resetFilters } from "@/lib/derivatives/model";
import { useScreenInsets } from "@/lib/safe-area";
import { useTheme } from "@/lib/theme/ThemeProvider";

const INVESTMENT: { value: BoardView["investment"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
];

/** A titled group inside the sheet, with the small caps label the rest of the app uses for sections. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2.5">
      <Text size="xs" weight="semibold" tone="muted" style={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

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
      <View className="mb-5 flex-row items-center">
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

      <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets scrollEnabled={false} contentContainerClassName="gap-5">
        <Section title="Strategy">
          <StrategySwitcher value={strategy} onChange={setStrategy} />
        </Section>

        <Section title="Sort by">
          <SortChips sort={view.sort} dir={view.dir} onSort={(key) => setView((v) => cycleSort(v, key))} />
        </Section>

        <Section title="Investment">
          <SegmentedControl tone="primary" segments={INVESTMENT} value={view.investment} onChange={(investment) => patch({ investment })} />
          <View className="flex-row gap-3">
            <RupeeInput label="Min" placeholder="0" value={view.min} onChange={(min) => patch({ min })} />
            <RupeeInput label="Max" placeholder="No limit" value={view.max} onChange={(max) => patch({ max })} />
          </View>
        </Section>

        <View className="h-12 flex-row items-center justify-between rounded-xl border border-border bg-muted px-4">
          <View className="flex-row items-center gap-2.5">
            <EyeSlashIcon size={18} weight="regular" color={colors.mutedForeground} />
            <Text size="sm" weight="medium">
              Show stale rows
            </Text>
          </View>
          <Switch
            accessibilityLabel="Show stale rows"
            value={!view.hideStale}
            onValueChange={(on) => patch({ hideStale: !on })}
            trackColor={{ false: colors.accent, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>

        <View className="gap-2 pt-1">
          <Button
            label={`Show ${matches} ${matches === 1 ? "contract" : "contracts"}`}
            variant="primary"
            onPress={() => router.back()}
          />
          <Button label="Reset filters" variant="quiet" onPress={() => setView((v) => ({ ...resetFilters(v), search: v.search }))} />
        </View>
      </ScrollView>
    </View>
  );
}
