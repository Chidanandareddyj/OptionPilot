import { useIsFocused, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Platform, RefreshControl, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { FormAlert } from "@/components/forms/FormAlert";
import { WifiSlashIcon } from "@/components/icons";
import { StatusPill } from "@/components/market/StatusPill";
import { TAB_BAR_CLEARANCE } from "@/components/navigation/FloatingTabBar";
import { PULL_THRESHOLD, PullHint } from "@/components/terminal/PullHint";
import { RecentSymbols } from "@/components/terminal/RecentSymbols";
import { ResumeCard } from "@/components/terminal/ResumeCard";
import { SearchField } from "@/components/terminal/SearchField";
import { ViewTiles } from "@/components/terminal/ViewTiles";
import { Button, Text } from "@/components/ui";
import { useAnalyzeFlow } from "@/lib/analysis/AnalyzeFlow";
import { useIndices, useQuotes, useRecentAnalyses } from "@/lib/api/hooks";
import { useOnline } from "@/lib/api/online";
import { buildRecentRows, recentStockSymbols } from "@/lib/market/recent";
import { marketStatus } from "@/lib/market/status";
import { useScreenInsets } from "@/lib/safe-area";
import { useTheme } from "@/lib/theme/ThemeProvider";

const NAV_BAR = 44;

export default function TerminalTab() {
  const router = useRouter();
  const insets = useScreenInsets();
  const { colors } = useTheme();
  const focused = useIsFocused();
  const online = useOnline();
  const { state, query, setQuery, start, reset } = useAnalyzeFlow();

  // Prices refresh every few seconds, but only while this tab is showing and there is a connection.
  const poll = focused && online;
  const history = useRecentAnalyses();
  const stocks = useMemo(() => recentStockSymbols(history.data ?? []), [history.data]);
  const indices = useIndices({ poll });
  const quotes = useQuotes(stocks, { poll });
  const rows = useMemo(() => buildRecentRows(indices.data, quotes.data, stocks), [indices.data, quotes.data, stocks]);

  const status = marketStatus({
    online,
    isLive: indices.data?.isLive,
    timestamp: indices.data?.timestamp,
  });

  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([indices.refetch(), quotes.refetch(), history.refetch()]);
    setRefreshing(false);
  }, [indices, quotes, history]);

  // iOS lets the list bounce past the top, which is what the pull hint follows. Android uses its own spinner.
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (Platform.OS === "ios") setPull(Math.max(0, -event.nativeEvent.contentOffset.y));
  };
  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (Platform.OS === "ios" && -event.nativeEvent.contentOffset.y >= PULL_THRESHOLD && !refreshing) void refresh();
  };

  const running = state.status === "running";
  const openSearch = () => {
    if (state.status === "failed") reset();
    router.push("/search");
  };
  const analyze = (symbol: string) => {
    if (!online || !start(symbol)) return;
    setQuery(symbol);
    router.push("/analysis/new");
  };
  const onAnalyzePress = () => (query.trim() ? analyze(query) : openSearch());

  const latest = history.data?.[0];

  return (
    <View className="flex-1 bg-background">
      <View pointerEvents="none" className="absolute inset-x-0" style={{ top: insets.top + NAV_BAR }}>
        <PullHint distance={pull} refreshing={refreshing} />
      </View>
      <ScrollView
        testID="terminal-scroll"
        className="flex-1"
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: TAB_BAR_CLEARANCE }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onScrollEndDrag={onScrollEnd}
        refreshControl={
          Platform.OS === "android" ? <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} /> : undefined
        }
      >
        <View className="h-[44px] flex-row items-center justify-end">
          <StatusPill status={status} />
        </View>

        <Text size="4xl" weight="semibold" tight accessibilityRole="header">
          Terminal
        </Text>
        <Text size="sm" tone="muted" className="mt-1">
          Pick a symbol to design a defined risk strategy.
        </Text>

        <View className="mt-4 flex-row items-center gap-2">
          <SearchField value={query} onPress={openSearch} onClear={() => setQuery("")} />
          <Button
            label={running ? "Calculating…" : "Analyze"}
            variant="primary"
            loading={running}
            disabled={!online}
            onPress={onAnalyzePress}
          />
        </View>

        {!online ? (
          <View className="mt-4">
            <FormAlert
              icon={WifiSlashIcon}
              title="You are offline"
              message="Prices and new analyses need a connection. Your saved analyses are still here."
            />
          </View>
        ) : state.status === "failed" ? (
          <View className="mt-4">
            <FormAlert title="Analysis failed" message={state.message} />
          </View>
        ) : null}

        {latest ? (
          <View className="mt-6">
            <ResumeCard analysis={latest} />
          </View>
        ) : null}

        <View className="mt-6">
          <RecentSymbols
            rows={rows}
            loading={online && (indices.isPending || quotes.isPending)}
            approximate={indices.data?.source === "fallback"}
            onSelect={analyze}
          />
        </View>

        <View className="mt-6">
          <ViewTiles />
        </View>
      </ScrollView>
    </View>
  );
}
