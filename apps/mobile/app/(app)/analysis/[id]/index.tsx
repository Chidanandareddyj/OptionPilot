import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { ActionBar, useActionBarClearance } from "@/components/analysis/ActionBar";
import { AnalysisHeader } from "@/components/analysis/AnalysisHeader";
import { AnalysisSkeleton } from "@/components/analysis/AnalysisSkeleton";
import { LegsList } from "@/components/analysis/LegsList";
import { PayoffCard } from "@/components/analysis/PayoffCard";
import { PayoffTable } from "@/components/analysis/PayoffTable";
import { StatsStrip } from "@/components/analysis/StatsStrip";
import { StrategyPicker } from "@/components/analysis/StrategyPicker";
import { StrategySelector } from "@/components/analysis/StrategySelector";
import { FormAlert } from "@/components/forms/FormAlert";
import { NavBar, useNavBarHeight } from "@/components/navigation/NavBar";
import { Button, SegmentedControl, type Segment } from "@/components/ui";
import {
  analysisHeader,
  initialStrategyKey,
  legCards,
  payoffTableRows,
  strategiesOf,
  strategyStats,
} from "@/lib/analysis/model";
import { useAnalysis } from "@/lib/api/hooks";
import { surfaceColors } from "@/lib/theme/colors";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { cn } from "@/lib/cn";

type PanelKey = "payoff" | "table" | "legs";

/** How far the page scrolls before the nav bar turns solid and shows the symbol. */
const SOLID_AFTER = 56;

export default function AnalysisScreen() {
  const router = useRouter();
  const { id, back } = useLocalSearchParams<{ id: string; back?: string }>();
  const backLabel = back || "Terminal";
  const actionBarClearance = useActionBarClearance();
  const navHeight = useNavBarHeight();
  const { scheme } = useTheme();
  const detail = useAnalysis(id);

  const [chosenKey, setChosenKey] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelKey>("payoff");
  const [picking, setPicking] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [switcherTop, setSwitcherTop] = useState<number | null>(null);

  const analysis = detail.data;
  const header = useMemo(() => (analysis ? analysisHeader(analysis.company, analysis.result) : null), [analysis]);
  const strategies = useMemo(() => (analysis ? strategiesOf(analysis.result) : []), [analysis]);
  const strategy = strategies.find((item) => item.key === (chosenKey ?? (analysis ? initialStrategyKey(strategies, analysis.decision) : null)));

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const comingNext = (feature: string) => Alert.alert(feature, "This arrives in the next update.");

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => setScrollY(event.nativeEvent.contentOffset.y);

  if (!analysis || !header || !strategy) {
    return (
      <View className="flex-1 bg-background px-4" style={{ paddingTop: navHeight }}>
        <NavBar backLabel={backLabel} onBack={goBack} />
        {detail.isError || (analysis && !strategy) ? (
          <View className="gap-4">
            <FormAlert
              title="Could not open this analysis"
              message={detail.isError ? "Check your connection and try again." : "This analysis has no strategies to show."}
            />
            {detail.isError ? <Button label="Try again" onPress={() => void detail.refetch()} /> : null}
          </View>
        ) : (
          <AnalysisSkeleton label="Loading…" />
        )}
      </View>
    );
  }

  const segments: Segment<PanelKey>[] = [
    { value: "payoff", label: "Payoff" },
    { value: "table", label: "Payoff table", count: strategy.payoffTable.length },
    { value: "legs", label: "Legs", count: strategy.legs.length },
  ];
  const stuck = switcherTop !== null && scrollY + navHeight >= switcherTop;
  const solid = scrollY > SOLID_AFTER;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingTop: navHeight, paddingBottom: actionBarClearance }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
      >
        <AnalysisHeader header={header} />
        <View className="mt-4">
          <StrategySelector strategy={strategy} onPress={() => setPicking(true)} />
        </View>
        <View
          className={cn("mt-3", stuck && "opacity-0")}
          onLayout={(event: LayoutChangeEvent) => setSwitcherTop(event.nativeEvent.layout.y)}
        >
          <SegmentedControl segments={segments} value={panel} onChange={setPanel} />
        </View>

        <View className="mt-3">
          {panel === "payoff" ? (
            <View className="gap-3">
              <PayoffCard strategy={strategy} spot={header.spot} />
              <StatsStrip stats={strategyStats(strategy, header.spot)} />
            </View>
          ) : panel === "table" ? (
            <PayoffTable rows={payoffTableRows(strategy, header.spot)} />
          ) : (
            <LegsList cards={legCards(strategy)} />
          )}
        </View>
      </ScrollView>

      {stuck ? (
        <View
          className="absolute inset-x-0 px-4 py-2"
          style={{ top: navHeight, backgroundColor: surfaceColors(scheme).glassBackground }}
        >
          <SegmentedControl segments={segments} value={panel} onChange={setPanel} />
        </View>
      ) : null}

      <NavBar backLabel={backLabel} onBack={goBack} title={header.symbol} solid={solid} />
      <ActionBar onCompare={() => comingNext("Compare all 12 strategies")} onRecommend={() => comingNext("Recommend a strategy")} />
      <StrategyPicker
        visible={picking}
        strategies={strategies}
        selectedKey={strategy.key}
        onSelect={(key) => {
          setChosenKey(key);
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />
    </View>
  );
}
