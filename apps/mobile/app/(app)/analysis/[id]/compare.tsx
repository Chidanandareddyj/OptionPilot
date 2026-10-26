import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, Switch, View } from "react-native";
import { COMPARE_FILTERS, filterCount, initialCompareState, paneStrategies, visibleStrategies, type CompareFilter } from "@optionpilot/shared";
import { BottomBar, useActionBarClearance } from "@/components/analysis/ActionBar";
import { ComparePane } from "@/components/compare/ComparePane";
import { CompareRowCard } from "@/components/compare/CompareRowCard";
import { EmptyMatches } from "@/components/compare/EmptyMatches";
import { FilterChips } from "@/components/compare/FilterChips";
import { StrategySearch } from "@/components/compare/StrategySearch";
import { SparkleIcon } from "@/components/icons";
import { FormAlert } from "@/components/forms/FormAlert";
import { NavBar, useNavBarHeight } from "@/components/navigation/NavBar";
import { Button, Skeleton, Text } from "@/components/ui";
import { compareRows } from "@/lib/analysis/compare";
import { analysisHeader, strategiesOf } from "@/lib/analysis/model";
import { useAnalysis } from "@/lib/api/hooks";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** Every strategy in one list, or two views side by side. Opened from the analysis. */
export default function CompareScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id, strategy: current } = useLocalSearchParams<{ id: string; strategy?: string }>();
  const navHeight = useNavBarHeight();
  const barClearance = useActionBarClearance();
  const detail = useAnalysis(id);
  const analysis = detail.data;

  const [filter, setFilter] = useState<CompareFilter>("all");
  const [query, setQuery] = useState("");
  const [chosenMode, setChosenMode] = useState<boolean | null>(null);

  const strategies = useMemo(() => (analysis ? strategiesOf(analysis.result) : []), [analysis]);
  const header = useMemo(() => (analysis ? analysisHeader(analysis.company, analysis.result) : null), [analysis]);
  const saved = useMemo(() => initialCompareState(analysis?.decision), [analysis]);
  const views = chosenMode ?? saved.compareMode;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const label = header?.symbol ?? "Analysis";

  if (!analysis || !header) {
    return (
      <View className="flex-1 bg-background px-4" style={{ paddingTop: navHeight }}>
        <NavBar backLabel={label} onBack={goBack} />
        {detail.isError ? (
          <View className="gap-4">
            <FormAlert title="Could not open this analysis" message="Check your connection and try again." />
            <Button label="Try again" onPress={() => void detail.refetch()} />
          </View>
        ) : (
          <View className="gap-3">
            <Skeleton width="75%" height={36} />
            <Skeleton height={52} radius={12} />
            <Skeleton height={112} radius={16} />
          </View>
        )}
      </View>
    );
  }

  const modeSwitch = (
    <>
      <Text size="sm" tone="muted">
        Compare views
      </Text>
      <Switch
        accessibilityLabel="Compare views"
        value={views}
        onValueChange={setChosenMode}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.background}
        ios_backgroundColor={colors.border}
      />
    </>
  );

  if (views) {
    const panes = paneStrategies(strategies, saved.selected);
    return (
      <View className="flex-1 bg-background">
        <ScrollView
          contentContainerClassName="gap-3 px-4"
          contentContainerStyle={{ paddingTop: navHeight, paddingBottom: barClearance }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-1 gap-2">
            <Text size="3xl" weight="semibold" tight accessibilityRole="header">
              Compare views
            </Text>
            <Text size="sm" tone="muted">
              Two views on {header.symbol}, same expiry{header.expiry ? ` ${header.expiry}` : ""}.
            </Text>
          </View>
          {[panes.left, panes.right].map((strategy, index) =>
            strategy ? <ComparePane key={`${index}-${strategy.key}`} strategy={strategy} spot={header.spot} /> : null,
          )}
        </ScrollView>
        <NavBar backLabel={label} onBack={goBack} right={modeSwitch} />
        <BottomBar>
          <View className="flex-1">
            <Button
              label="Recommend"
              variant="primary"
              icon={SparkleIcon}
              onPress={() => router.push({ pathname: "/analysis/[id]/recommend", params: { id, pane: "left", from: "compare" } })}
            />
          </View>
        </BottomBar>
      </View>
    );
  }

  const shown = compareRows(visibleStrategies(strategies, saved.single, filter, query));
  const chips = COMPARE_FILTERS.map((item) => ({ value: item.id, label: item.label, count: filterCount(strategies, item.id) }));

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="gap-3 px-4"
        contentContainerStyle={{ paddingTop: navHeight, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-1 gap-2">
          <Text size="3xl" weight="semibold" tight accessibilityRole="header">
            {`Compare all\n${strategies.length} strategies`}
          </Text>
          <Text size="sm" tone="muted">
            {saved.single ? "Ranked by recommendation score." : "In catalogue order."} Select a row to load its payoff.
          </Text>
        </View>
        <StrategySearch value={query} onChangeText={setQuery} />
        <FilterChips chips={chips} value={filter} onChange={setFilter} />
        {shown.length === 0 ? (
          <EmptyMatches query={query} total={strategies.length} />
        ) : (
          shown.map((row) => (
            <CompareRowCard
              key={row.key}
              row={row}
              selected={row.key === current}
              onPress={() => router.dismissTo({ pathname: "/analysis/[id]", params: { id, strategy: row.key, at: String(Date.now()) } })}
            />
          ))
        )}
      </ScrollView>
      <NavBar backLabel={label} onBack={goBack} right={modeSwitch} />
    </View>
  );
}
