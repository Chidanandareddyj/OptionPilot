import { useCallback, useEffect, useRef, type ComponentRef } from "react";
import { Animated, Pressable, ScrollView, View, type LayoutRectangle } from "react-native";
import { Text } from "@/components/ui";
import { CrossfadeLabel, SelectionPill, usePressScale, useSelectionPill } from "@/components/ui/SelectionPill";
import { strategySegments } from "@/lib/derivatives/model";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** Space kept between a revealed chip and the edge of the switcher. */
const REVEAL_INSET = 8;

type StrategyChipProps = {
  label: string;
  selected: boolean;
  /** Keeps the plain accent fill until the sliding pill has a measured position. */
  fallback: boolean;
  reducedMotion: boolean;
  onLayout: (layout: LayoutRectangle) => void;
  onPress: () => void;
};

function StrategyChip({ label, selected, fallback, reducedMotion, onLayout, onPress }: StrategyChipProps) {
  const press = usePressScale(reducedMotion);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onLayout={(event) => onLayout(event.nativeEvent.layout)}
      className={`h-11 items-center justify-center rounded-lg px-3 ${selected && fallback ? "bg-primary" : ""}`}
    >
      <Animated.View style={{ transform: [{ scale: press.scale }] }}>
        <CrossfadeLabel
          selected={selected}
          reducedMotion={reducedMotion}
          active={
            <Text size="sm" weight="semibold" tone="onPrimary" numberOfLines={1}>
              {label}
            </Text>
          }
          inactive={
            <Text size="sm" weight="medium" tone="muted" numberOfLines={1}>
              {label}
            </Text>
          }
        />
      </Animated.View>
    </Pressable>
  );
}

/** All twelve strategies in one row. Names are too long to share the width, so the row scrolls and keeps the selected chip in view. */
export function StrategySwitcher({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { colors } = useTheme();
  const { layout, translateX, measure, reducedMotion } = useSelectionPill(value);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const offsets = useRef<Record<string, LayoutRectangle>>({});
  const viewport = useRef(0);
  const content = useRef(0);
  const offset = useRef(0);
  /** False until the opening selection has been brought into view without animating. */
  const revealed = useRef(false);

  const reveal = useCallback((chip: LayoutRectangle, animated: boolean) => {
    const width = viewport.current;
    if (!width) return;

    const left = Math.max(0, chip.x - REVEAL_INSET);
    const right = chip.x + chip.width + REVEAL_INSET;
    const current = offset.current;
    const target = left < current ? left : right > current + width ? right - width : null;
    if (target === null) return;

    scroller.current?.scrollTo({
      x: Math.min(Math.max(0, target), Math.max(0, content.current - width)),
      animated,
    });
  }, []);

  // The opening chip jumps into view; after that every selection glides alongside the pill.
  const showSelected = useCallback(
    (chip: LayoutRectangle) => {
      // Without a viewport there is nothing to reveal into yet; keep the opening reveal for later.
      if (!viewport.current) return;
      reveal(chip, revealed.current && !reducedMotion);
      revealed.current = true;
    },
    [reducedMotion, reveal],
  );

  useEffect(() => {
    const chip = offsets.current[value];
    if (!chip || !viewport.current) return;
    showSelected(chip);
  }, [showSelected, value]);

  return (
    <View className="h-[52px] overflow-hidden rounded-xl border border-border bg-muted">
      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onLayout={(event) => {
          viewport.current = event.nativeEvent.layout.width;
          const chip = offsets.current[value];
          if (chip && !revealed.current) showSelected(chip);
        }}
        onContentSizeChange={(width) => {
          content.current = width;
        }}
        onScroll={(event) => {
          offset.current = event.nativeEvent.contentOffset.x;
        }}
        contentContainerClassName="h-[52px] items-center gap-1 p-1"
      >
        <SelectionPill layout={layout} translateX={translateX} color={colors.primary} radius={8} />
        {strategySegments().map((segment) => {
          const selected = segment.value === value;
          return (
            <StrategyChip
              key={segment.value}
              label={segment.label}
              selected={selected}
              fallback={!layout}
              reducedMotion={reducedMotion}
              onLayout={(next) => {
                offsets.current[segment.value] = next;
                measure(segment.value, next);
                if (selected && !revealed.current && viewport.current > 0) showSelected(next);
              }}
              onPress={() => onChange(segment.value)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
