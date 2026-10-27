import { memo } from "react";
import { View } from "react-native";
import type { AnalysisSummary } from "@optionpilot/shared";
import { VIEW_ICON } from "@/components/analysis/ViewTag";
import { ArrowsLeftRightIcon, ChartLineUpIcon } from "@/components/icons";
import { Card, Tag, Text } from "@/components/ui";
import { money } from "@/lib/analysis/format";
import { formatHistoryTime, historyTag } from "@/lib/history/model";
import { SwipeRow } from "./SwipeRow";

type HistoryRowProps = { analysis: AnalysisSummary; onOpen: (analysis: AnalysisSummary) => void; onDelete: (analysis: AnalysisSummary) => void };

/** One saved analysis: symbol and spot, then what was in it and when it was saved. Slides left to delete. */
export const HistoryRow = memo(function HistoryRow({ analysis, onOpen, onDelete }: HistoryRowProps) {
  const tag = historyTag(analysis.tag);
  const when = formatHistoryTime(analysis.createdAt);
  const spot = analysis.spot === null ? "No spot" : `₹${money(analysis.spot)}`;
  const icon = tag.icon === "strategies" ? ChartLineUpIcon : tag.icon === "compare" ? ArrowsLeftRightIcon : VIEW_ICON[tag.icon];
  return (
    <SwipeRow
      actionLabel="Delete"
      accessibilityLabel={`${analysis.company}, ${spot}, ${tag.label}, saved ${when}`}
      accessibilityHint="Opens the saved snapshot"
      onPress={() => onOpen(analysis)}
      onAction={() => onDelete(analysis)}
    >
      <Card className="gap-[11px] px-4 pb-3 pt-[13px]">
        <View className="flex-row items-center justify-between">
          <Text size="lg" weight="semibold" numberOfLines={1} className="shrink" style={{ lineHeight: 20 }}>
            {analysis.company}
          </Text>
          <Text mono weight="medium" tone={analysis.spot === null ? "muted" : "foreground"} style={{ lineHeight: 20 }}>
            {spot}
          </Text>
        </View>
        <View className="flex-row items-center justify-between gap-2">
          <Tag icon={icon} label={tag.label} className="shrink" />
          <Text size="xs" tone="muted" numberOfLines={1}>
            {when}
          </Text>
        </View>
      </Card>
    </SwipeRow>
  );
});
