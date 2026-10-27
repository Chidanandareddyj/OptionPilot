import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import type { AnalysisSummary } from "@optionpilot/shared";
import { ViewTag } from "@/components/analysis/ViewTag";
import { Sparkline } from "@/components/chart/Sparkline";
import { CaretRightIcon } from "@/components/icons";
import { Card, Skeleton, Text } from "@/components/ui";
import { formatSavedAt } from "@/lib/analysis/format";
import { initialStrategyKey, parseTag, strategiesOf } from "@/lib/analysis/model";
import { useAnalysis } from "@/lib/api/hooks";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** The newest saved analysis, to pick up where you left off. */
export function ResumeCard({ analysis }: { analysis: AnalysisSummary }) {
  const router = useRouter();
  const { colors } = useTheme();
  const detail = useAnalysis(analysis.id);
  const tag = parseTag(analysis.tag);

  const strategies = detail.data ? strategiesOf(detail.data.result) : [];
  const key = detail.data ? initialStrategyKey(strategies, detail.data.decision) : null;
  const strategy = strategies.find((item) => item.key === key);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Resume last analysis, ${analysis.company}, ${analysis.tag}`}
      onPress={() => router.push({ pathname: "/analysis/[id]", params: { id: analysis.id } })}
    >
      <Card className="flex-row items-center gap-3 p-4">
        <View className="flex-1 gap-1">
          <Text size="xs" tone="muted">
            Resume last analysis
          </Text>
          <Text size="lg" weight="semibold">
            {analysis.company}
          </Text>
          <View className="flex-row items-center gap-2">
            {tag.view ? <ViewTag view={tag.view} /> : null}
            <Text size="sm" tone="muted" numberOfLines={1} className="shrink">
              {tag.name}
            </Text>
          </View>
          <Text size="xs" tone="faint">
            {formatSavedAt(analysis.createdAt)}
          </Text>
        </View>
        {strategy ? <Sparkline strategy={strategy} width={72} height={40} /> : <Skeleton width={72} height={40} />}
        <CaretRightIcon size={20} weight="bold" color={colors.mutedForeground} />
      </Card>
    </Pressable>
  );
}
