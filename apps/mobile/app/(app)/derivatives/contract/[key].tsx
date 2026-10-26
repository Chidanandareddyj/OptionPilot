import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { PayoffChart } from "@/components/chart/PayoffChart";
import { ContractPayoffTable } from "@/components/derivatives/ContractPayoffTable";
import { ChartLineUpIcon, TableIcon, ArrowRightIcon, XIcon } from "@/components/icons";
import { Button, Card, Skeleton, Text } from "@/components/ui";
import { useAnalyzeFlow } from "@/lib/analysis/AnalyzeFlow";
import { contractDetail } from "@/lib/derivatives/detail";
import { useLiveFeed } from "@/lib/derivatives/FeedProvider";
import { legSummary, parseStrategy, shortExpiry } from "@/lib/derivatives/model";
import { useScreenInsets } from "@/lib/safe-area";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** One contract from the board as a form sheet: the payoff chart and numbers, or the payoff table, and a way into a full analysis. */
export default function ContractSheet() {
  const router = useRouter();
  const insets = useScreenInsets();
  const { colors } = useTheme();
  const { key, strategy: strategyParam } = useLocalSearchParams<{ key: string; strategy?: string }>();
  const strategy = parseStrategy(strategyParam);
  const { companies, feed } = useLiveFeed();
  const { start, setQuery } = useAnalyzeFlow();
  const [showTable, setShowTable] = useState(false);

  const company = companies.find((c) => c.k === key);
  const detail = useMemo(() => (company && feed ? contractDetail(company, feed, strategy) : null), [company, feed, strategy]);

  const close = () => router.back();
  const analyze = () => {
    if (!detail || !start(detail.evaluation.symbol)) return;
    setQuery(detail.evaluation.symbol);
    // The Calculating screen waits for the run, then opens the analysis. This sheet makes way for it.
    router.replace("/analysis/new");
  };

  const evaluation = detail?.evaluation;
  return (
    <View className="bg-card px-4 pt-6" style={{ paddingBottom: Math.max(insets.bottom, 24) + 8 }}>
      <View className="mb-4 flex-row items-start gap-3">
        <View className="flex-1">
          <Text size="2xl" weight="semibold" tight accessibilityRole="header" numberOfLines={1}>
            {evaluation?.symbol ?? company?.s ?? "Contract"}
          </Text>
          {evaluation ? (
            <Text size="sm" tone="muted" mono numberOfLines={2}>
              {`lot ${evaluation.lot.toLocaleString("en-IN")} · spot ${evaluation.spot.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · ${legSummary(evaluation.legs)} · ${shortExpiry(evaluation.expiry)}`}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={close}
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-card"
        >
          <XIcon size={20} weight="bold" color={colors.foreground} />
        </Pressable>
      </View>

      {detail && evaluation ? (
        <ScrollView scrollEnabled={false} contentContainerClassName="gap-4">
          {showTable ? (
            <ContractPayoffTable rows={detail.rows} />
          ) : (
            <>
              <Card className="px-0 py-0">
                <PayoffChart strategy={detail.model} spot={evaluation.spot} />
              </Card>
              <View className="flex-row flex-wrap gap-y-3">
                {detail.stats.map((stat) => (
                  <View key={stat.label} className="w-1/3 pr-2" accessible accessibilityLabel={`${stat.label}, ${stat.value}`}>
                    <Text size="xs" tone="muted">
                      {stat.label}
                    </Text>
                    <Text size="xl" mono weight={stat.strong ? "semibold" : "medium"} tone={stat.tone ?? "foreground"} numberOfLines={1} adjustsFontSizeToFit>
                      {stat.value}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
          <View className="flex-row gap-3">
            <Button
              label={showTable ? "Show payoff" : "Payoff table"}
              variant="ghost"
              icon={showTable ? ChartLineUpIcon : TableIcon}
              onPress={() => setShowTable((on) => !on)}
              className="flex-1"
            />
            <Button label="Analyze" variant="primary" icon={ArrowRightIcon} onPress={analyze} className="flex-1" />
          </View>
        </ScrollView>
      ) : feed && companies.length > 0 ? (
        <Text tone="muted" className="py-8 text-center">
          This contract is not on the board right now.
        </Text>
      ) : (
        <View className="gap-3 pb-4" accessibilityLabel="Waiting for prices">
          <Skeleton height={250} radius={16} />
          <Skeleton height={64} radius={12} />
        </View>
      )}
    </View>
  );
}
