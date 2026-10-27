import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { initialCompareState } from "@optionpilot/shared";
import { BottomBar, useActionBarClearance } from "@/components/analysis/ActionBar";
import { FormAlert } from "@/components/forms/FormAlert";
import { ArrowsClockwiseIcon, ChartLineUpIcon, SlidersHorizontalIcon, SparkleIcon, WarningIcon } from "@/components/icons";
import { NavBar, useNavBarHeight } from "@/components/navigation/NavBar";
import { BestPickCard } from "@/components/recommend/BestPickCard";
import { ContextBadges } from "@/components/recommend/ContextBadges";
import { RankedList } from "@/components/recommend/RankedList";
import { SummaryText } from "@/components/recommend/SummaryText";
import { Button, Skeleton, Text } from "@/components/ui";
import { bestPick, contextBadges, decisionSubtitle, rankedRows } from "@/lib/analysis/recommend";
import { analysisHeader } from "@/lib/analysis/model";
import { useAnalysis } from "@/lib/api/hooks";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** The answer to "Which strategy fits?": the pick, the numbers behind it and the ranking. Reads the saved recommendation. */
export default function RecommendationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const navHeight = useNavBarHeight();
  const barClearance = useActionBarClearance();
  const detail = useAnalysis(id);
  const analysis = detail.data;

  const header = useMemo(() => (analysis ? analysisHeader(analysis.company, analysis.result) : null), [analysis]);
  const decision = useMemo(() => initialCompareState(analysis?.decision).single, [analysis]);
  const label = header?.symbol ?? "Analysis";

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const openSheet = () => router.push({ pathname: "/analysis/[id]/recommend", params: { id, from: "result" } });
  const showPayoff = (strategy: string) =>
    router.dismissTo({ pathname: "/analysis/[id]", params: { id, strategy, at: String(Date.now()) } });

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
            <Skeleton height={112} radius={16} />
          </View>
        )}
      </View>
    );
  }

  const pick = decision ? bestPick(decision) : null;
  const summary = decision?.summary?.trim();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="gap-4 px-4"
        contentContainerStyle={{ paddingTop: navHeight, paddingBottom: barClearance }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-2">
          <Text size="4xl" weight="semibold" tight accessibilityRole="header">
            Which strategy fits?
          </Text>
          {decision ? (
            <Text size="sm" tone="muted">
              {decisionSubtitle(decision)}
            </Text>
          ) : null}
        </View>

        {decision ? (
          <>
            {pick ? (
              <>
                <ContextBadges badges={contextBadges(decision)} />
                <BestPickCard pick={pick} onShowPayoff={() => showPayoff(pick.key)} />
                {summary ? <SummaryText text={summary} /> : null}
              </>
            ) : (
              <View accessibilityRole="alert" className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
                <WarningIcon size={24} weight="fill" color={colors.foreground} />
                <Text size="sm" className="flex-1">
                  No strategy is viable for this view and loss budget. Expand the rows below to see why.
                </Text>
              </View>
            )}
            <RankedList rows={rankedRows(decision)} onShowPayoff={showPayoff} />
          </>
        ) : (
          <View className="items-center gap-2 px-6 pt-8">
            <Text size="lg" weight="semibold">
              Nothing scored yet
            </Text>
            <Text size="sm" tone="muted" className="text-center">
              Pick a view and a loss budget, and OptionPilot ranks the strategies for you.
            </Text>
          </View>
        )}
      </ScrollView>

      <NavBar backLabel={label} onBack={goBack} />
      <BottomBar>
        {decision && !pick ? (
          <View className="flex-1">
            <Button label="Change loss budget" variant="primary" icon={SlidersHorizontalIcon} onPress={openSheet} />
          </View>
        ) : decision && pick ? (
          <>
            <View className="flex-1">
              <Button label="Rescore" variant="ghost" icon={ArrowsClockwiseIcon} onPress={openSheet} />
            </View>
            <View className="flex-1">
              <Button label="Open payoff" variant="primary" icon={ChartLineUpIcon} onPress={() => showPayoff(pick.key)} />
            </View>
          </>
        ) : (
          <View className="flex-1">
            <Button label="Recommend" variant="primary" icon={SparkleIcon} onPress={openSheet} />
          </View>
        )}
      </BottomBar>
    </View>
  );
}
