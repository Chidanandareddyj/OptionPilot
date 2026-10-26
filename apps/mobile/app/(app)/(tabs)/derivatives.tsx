import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import {
  applyView,
  boardCountText,
  connectionLabel,
  countStale,
  evaluateBoard,
  isMarketOpen,
  staleNote,
} from "@optionpilot/shared";
import { StrategySearch } from "@/components/compare/StrategySearch";
import { BoardSkeleton } from "@/components/derivatives/BoardSkeleton";
import { ContractCard } from "@/components/derivatives/ContractCard";
import { EmptyCompanies } from "@/components/derivatives/EmptyCompanies";
import { ActiveFilterChips } from "@/components/derivatives/FilterChips";
import { FilterButton } from "@/components/derivatives/FilterButton";
import { InfoBanner } from "@/components/derivatives/InfoBanner";
import { FormAlert } from "@/components/forms/FormAlert";
import { StatusPill } from "@/components/market/StatusPill";
import { TAB_BAR_CLEARANCE } from "@/components/navigation/FloatingTabBar";
import { PULL_THRESHOLD, PullHint } from "@/components/terminal/PullHint";
import { SegmentedControl, Text } from "@/components/ui";
import { useOnline } from "@/lib/api/online";
import { useBoardState } from "@/lib/derivatives/BoardState";
import { useLiveFeed } from "@/lib/derivatives/FeedProvider";
import {
  activeFilterCount,
  boardStatus,
  clearFilter,
  closedBanner,
  contractCard,
  filterChips,
  parseStrategy,
  resetFilters,
  strategySegments,
} from "@/lib/derivatives/model";
import { useScreenInsets } from "@/lib/safe-area";
import { useTheme } from "@/lib/theme/ThemeProvider";

const NAV_BAR = 44;

/** The live "All derivatives" screener: every F&O company priced for one strategy, from the relay's stream. */
export default function DerivativesTab() {
  const router = useRouter();
  const insets = useScreenInsets();
  const { colors } = useTheme();
  const online = useOnline();
  const focused = useIsFocused();
  const { strategy, setStrategy, view, setView } = useBoardState();
  const { companies, feed, conn, error, refresh } = useLiveFeed(focused);

  // A Browse by view tile on the Terminal opens this tab on its strategy. `at` makes tapping the same tile again count.
  const { strategy: linked, at } = useLocalSearchParams<{ strategy?: string; at?: string }>();
  useEffect(() => {
    if (linked) setStrategy(parseStrategy(linked));
  }, [linked, at, setStrategy]);

  const { evaluations, unavailable } = useMemo(() => evaluateBoard(companies, feed, strategy), [companies, feed, strategy]);
  const visible = useMemo(() => applyView(evaluations, view), [evaluations, view]);
  const staleCount = useMemo(() => countStale(evaluations, view), [evaluations, view]);
  const cards = useMemo(() => visible.map(contractCard), [visible]);

  const label = connectionLabel(conn, feed);
  const status = boardStatus({ online, conn, label, feed });
  const filters = filterChips(view);

  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const reconnect = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);
  // iOS lets the list bounce past the top, which is what the pull hint follows. Android uses its own spinner.
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (Platform.OS === "ios") setPull(Math.max(0, -event.nativeEvent.contentOffset.y));
  };
  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (Platform.OS === "ios" && -event.nativeEvent.contentOffset.y >= PULL_THRESHOLD && !refreshing) void reconnect();
  };

  const openContract = useCallback(
    (key: string) => router.push({ pathname: "/derivatives/contract/[key]", params: { key, strategy } }),
    [router, strategy],
  );
  const renderItem = useCallback(({ item }: { item: (typeof cards)[number] }) => <ContractCard card={item} onPress={openContract} />, [openContract]);

  const note = staleNote(staleCount, view.hideStale);
  const summary = feed ? `${boardCountText(visible.length, evaluations.length, unavailable)}${note ? `. ${note}.` : ""}` : "Waiting for prices…";

  const header = (
    <View className="gap-4 pb-4">
      <View>
        <View className="h-[44px] flex-row items-center justify-end">
          <StatusPill status={status} />
        </View>
        <Text size="sm" tone="muted">
          Screener
        </Text>
        <Text size="4xl" weight="semibold" tight accessibilityRole="header">
          All derivatives
        </Text>
      </View>

      {error ? <FormAlert title="Live feed unavailable" message={`${error.replace(/\.$/, "")}. Retrying automatically.`} /> : null}
      {feed && !isMarketOpen(feed) ? <InfoBanner {...closedBanner(feed)} footnote="Opens weekdays 9:15 am IST" /> : null}

      <View className="flex-row items-center gap-2">
        <StrategySearch
          className="flex-1"
          placeholder="Search symbol"
          autoCapitalize="characters"
          value={view.search}
          onChangeText={(search) => setView((v) => ({ ...v, search }))}
        />
        <FilterButton count={activeFilterCount(view)} onPress={() => router.push("/derivatives/filters")} />
      </View>
      <SegmentedControl tone="primary" segments={strategySegments(strategy)} value={strategy} onChange={setStrategy} />
      {filters.length > 0 ? <ActiveFilterChips chips={filters} onRemove={(id) => setView((v) => clearFilter(v, id))} /> : null}
      <Text size="sm" tone="muted" accessibilityLiveRegion="polite">
        {summary}
      </Text>
    </View>
  );

  const empty = feed ? (
    <EmptyCompanies search={view.search} onClear={() => setView((v) => resetFilters(v))} />
  ) : (
    <BoardSkeleton />
  );

  return (
    <View className="flex-1 bg-background">
      <View pointerEvents="none" className="absolute inset-x-0" style={{ top: insets.top + NAV_BAR }}>
        <PullHint distance={pull} refreshing={refreshing} />
      </View>
      <FlatList<(typeof cards)[number]>
        testID="derivatives-list"
        data={cards}
        keyExtractor={(card) => card.key}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ItemSeparatorComponent={Separator}
        className="flex-1"
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: TAB_BAR_CLEARANCE }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onScrollEndDrag={onScrollEnd}
        initialNumToRender={8}
        windowSize={7}
        refreshControl={
          Platform.OS === "android" ? <RefreshControl refreshing={refreshing} onRefresh={reconnect} colors={[colors.primary]} /> : undefined
        }
      />
    </View>
  );
}

const Separator = () => <View className="h-3" />;

