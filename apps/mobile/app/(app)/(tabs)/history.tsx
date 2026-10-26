import { useIsFocused, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import type { AnalysisSummary } from "@optionpilot/shared";
import { FormAlert } from "@/components/forms/FormAlert";
import { HistoryEmpty } from "@/components/history/HistoryEmpty";
import { HistoryRow } from "@/components/history/HistoryRow";
import { HistorySkeleton } from "@/components/history/HistorySkeleton";
import { UndoBar } from "@/components/history/UndoBar";
import { TAB_BAR_CLEARANCE } from "@/components/navigation/FloatingTabBar";
import { PULL_THRESHOLD, PullHint } from "@/components/terminal/PullHint";
import { Button, Text } from "@/components/ui";
import { useHistory } from "@/lib/api/hooks";
import { flattenHistory, historySubtitle } from "@/lib/history/model";
import { useHistoryDelete } from "@/lib/history/useHistoryDelete";
import { PREVIEW_PULL, useScreenInsets } from "@/lib/safe-area";
import { useTheme } from "@/lib/theme/ThemeProvider";

const NAV_BAR = 44;

export default function HistoryTab() {
  const router = useRouter();
  const insets = useScreenInsets();
  const { colors } = useTheme();
  const focused = useIsFocused();
  const history = useHistory();
  const { notice, remove, undo, dismiss } = useHistoryDelete();
  const items = useMemo(() => flattenHistory(history.data), [history.data]);

  const [pull, setPull] = useState(PREVIEW_PULL);
  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await history.refetch();
    setRefreshing(false);
  }, [history]);

  // iOS lets the list bounce past the top, which is what the pull hint follows. Android uses its own spinner.
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (Platform.OS === "ios") setPull(Math.max(0, -event.nativeEvent.contentOffset.y));
  };
  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (Platform.OS === "ios" && -event.nativeEvent.contentOffset.y >= PULL_THRESHOLD && !refreshing) void refresh();
  };

  const open = useCallback(
    (analysis: AnalysisSummary) =>
      router.push({ pathname: "/analysis/[id]", params: { id: analysis.id, snapshot: "1", back: "History" } }),
    [router],
  );

  const loading = history.isPending;
  const failed = history.isError && !history.data;
  const empty = !loading && !failed && items.length === 0;
  const state = loading ? "loading" : failed ? "error" : "ready";
  const subtitle = historySubtitle(state, items.length, history.hasNextPage);

  const header = (
    <View className="pb-[17px]" style={{ paddingTop: NAV_BAR }}>
      <Text size="4xl" weight="semibold" tight accessibilityRole="header">
        Analysis history
      </Text>
      <Text size="sm" tone="muted" className="mt-[7px]">
        {subtitle}
      </Text>
    </View>
  );

  const footer = history.isFetchNextPageError ? (
    <View className="items-center pt-3">
      <Button label="Could not load more. Try again" variant="ghost" size="sm" onPress={() => void history.fetchNextPage()} />
    </View>
  ) : history.isFetchingNextPage ? (
    <View className="items-center pt-4" accessibilityLabel="Loading more">
      <ActivityIndicator color={colors.mutedForeground} />
    </View>
  ) : undefined;

  return (
    <View className="flex-1 bg-background">
      <View pointerEvents="none" className="absolute inset-x-0" style={{ top: insets.top + NAV_BAR - 8 }}>
        <PullHint distance={pull} refreshing={refreshing} subject="" />
      </View>
      <FlatList<AnalysisSummary>
        testID="history-list"
        data={loading || failed ? [] : items}
        keyExtractor={(analysis) => analysis.id}
        renderItem={({ item }) => <HistoryRow analysis={item} onOpen={open} onDelete={remove} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? (
            <HistorySkeleton />
          ) : failed ? (
            <View className="gap-4">
              <FormAlert title="Could not load history" message="Check your connection and try again." />
              <Button label="Try again" onPress={() => void history.refetch()} />
            </View>
          ) : empty ? (
            <HistoryEmpty onOpenTerminal={() => router.navigate("/terminal")} />
          ) : undefined
        }
        ListFooterComponent={footer}
        ItemSeparatorComponent={Separator}
        onEndReached={() => {
          if (focused && history.hasNextPage && !history.isFetchingNextPage && !history.isFetchNextPageError) void history.fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        className="flex-1"
        style={PREVIEW_PULL ? { transform: [{ translateY: PREVIEW_PULL }] } : undefined}
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: TAB_BAR_CLEARANCE + (notice ? 72 : 0) }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onScrollEndDrag={onScrollEnd}
        refreshControl={
          Platform.OS === "android" ? <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} /> : undefined
        }
      />
      {notice ? (
        <View className="absolute inset-x-4" style={{ bottom: Math.max(insets.bottom, 12) + 80 }}>
          <UndoBar notice={notice} onUndo={undo} onDismiss={dismiss} />
        </View>
      ) : null}
    </View>
  );
}

const Separator = () => <View className="h-2" />;
