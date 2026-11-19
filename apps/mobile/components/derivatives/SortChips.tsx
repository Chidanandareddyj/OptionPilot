import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, type LayoutRectangle } from "react-native";
import type { BoardView } from "@optionpilot/shared";
import { CaretDownIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { CrossfadeLabel, SelectionPill, usePressScale, useSelectionPill } from "@/components/ui/SelectionPill";
import { cn } from "@/lib/cn";
import { SORT_OPTIONS } from "@/lib/derivatives/model";
import { TAB_BAR_FADE_MS, TAB_EASE } from "@/lib/motion";
import { useTheme } from "@/lib/theme/ThemeProvider";

type SortChipsProps = {
  sort: BoardView["sort"];
  dir: BoardView["dir"];
  onSort: (key: BoardView["sort"]) => void;
  className?: string;
};

type SortChipProps = {
  option: (typeof SORT_OPTIONS)[number];
  selected: boolean;
  dir: BoardView["dir"];
  /** Keeps the plain accent fill until the sliding pill has a measured position. */
  fallback: boolean;
  /** Keeps the card fill at rest; an opaque chip would hide the pill while it slides. */
  showFill: boolean;
  reducedMotion: boolean;
  onLayout: (layout: LayoutRectangle) => void;
  onPress: () => void;
};

function SortChip({ option, selected, dir, fallback, showFill, reducedMotion, onLayout, onPress }: SortChipProps) {
  const { colors } = useTheme();
  const press = usePressScale(reducedMotion);
  const [caret] = useState(() => new Animated.Value(selected ? 1 : 0));
  const [direction] = useState(() => new Animated.Value(dir === "asc" ? 1 : 0));
  const caretTarget = useRef(selected ? 1 : 0);
  const directionTarget = useRef(dir === "asc" ? 1 : 0);

  useEffect(() => {
    const next = selected ? 1 : 0;
    if (caretTarget.current === next) return;
    caretTarget.current = next;

    Animated.timing(caret, {
      toValue: next,
      duration: reducedMotion ? 0 : TAB_BAR_FADE_MS,
      easing: TAB_EASE,
      useNativeDriver: true,
    }).start();
  }, [caret, reducedMotion, selected]);

  useEffect(() => {
    if (!selected) return;

    const next = dir === "asc" ? 1 : 0;
    if (directionTarget.current === next) return;
    directionTarget.current = next;

    Animated.timing(direction, {
      toValue: next,
      duration: reducedMotion ? 0 : TAB_BAR_FADE_MS,
      easing: TAB_EASE,
      useNativeDriver: true,
    }).start();
  }, [direction, dir, reducedMotion, selected]);

  // One down caret rotated a half turn is exactly the up caret, so direction can animate.
  const rotate = direction.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`Sort by ${option.label}`}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onLayout={(event) => onLayout(event.nativeEvent.layout)}
      className={cn(
        "h-10 flex-row items-center rounded-full border px-3.5",
        selected ? "border-primary" : "border-border",
        !selected && showFill ? "bg-card" : "",
        selected && fallback ? "bg-primary" : "",
      )}
    >
      <Animated.View className="flex-row items-center gap-1.5" style={{ transform: [{ scale: press.scale }] }}>
        <CrossfadeLabel
          selected={selected}
          reducedMotion={reducedMotion}
          active={
            <Text size="sm" weight="semibold" tone="onPrimary" numberOfLines={1}>
              {option.label}
            </Text>
          }
          inactive={
            <Text size="sm" weight="medium" tone="muted" numberOfLines={1}>
              {option.label}
            </Text>
          }
        />
        {/* The slot stays in the flow in both states so selecting a chip never changes its width. */}
        <Animated.View style={{ opacity: caret, transform: [{ rotate }] }}>
          <CaretDownIcon size={12} weight="bold" color={colors.primaryForeground} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/** The board's sort order as chips: the chosen field fills in and shows its direction; choosing it again flips. */
export function SortChips({ sort, dir, onSort, className }: SortChipsProps) {
  const { colors } = useTheme();
  const { layout, translateX, measure, reducedMotion, sliding } = useSelectionPill(sort);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={className}
      contentContainerClassName="items-center gap-2"
    >
      <SelectionPill layout={layout} translateX={translateX} color={colors.primary} />
      {SORT_OPTIONS.map((option) => (
        <SortChip
          key={option.value}
          option={option}
          selected={option.value === sort}
          dir={dir}
          fallback={!layout}
          showFill={!sliding}
          reducedMotion={reducedMotion}
          onLayout={(next) => measure(option.value, next)}
          onPress={() => onSort(option.value)}
        />
      ))}
    </ScrollView>
  );
}
