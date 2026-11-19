import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, type LayoutRectangle } from "react-native";
import { XIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import type { FilterId } from "@/lib/derivatives/model";
import { CHIP_PRESS_SCALE, CHIP_REMOVE_MS, TAB_EASE } from "@/lib/motion";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Chip = { id: FilterId; label: string };

type ChipsProps = { chips: Chip[]; onRemove: (id: FilterId) => void };

/** A chip the parent has already removed, kept in the row until it has collapsed away. */
type Ghost = Chip & { width: number };

const CHIP_HEIGHT = 40;

/** The row's `gap-2`; a collapsing chip gives back the gaps the row loses with it. */
const CHIP_GAP = 8;

/** The chips have a fixed order, the same one `filterChips` builds. */
const FILTER_ORDER: FilterId[] = ["investment", "min", "max"];

function ChipBody({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <>
      <Text size="sm" weight="medium" tone="foreground">
        {label}
      </Text>
      <XIcon size={14} weight="bold" color={colors.mutedForeground} />
    </>
  );
}

type ExitingChipProps = {
  chip: Chip;
  width: number;
  /** Whether the gap on that side disappears with the chip, and so has to close with it. */
  collapseBefore: boolean;
  collapseAfter: boolean;
  onDone: (id: FilterId) => void;
};

function ExitingChip({ chip, width, collapseBefore, collapseAfter, onDone }: ExitingChipProps) {
  const [progress] = useState(() => new Animated.Value(1));
  const mounted = useRef(true);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 0,
      duration: CHIP_REMOVE_MS,
      easing: TAB_EASE,
      // The width and height of the box collapse, which cannot run on the native driver.
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished && mounted.current) onDone(chip.id);
    });
    return () => {
      mounted.current = false;
      animation.stop();
    };
  }, [chip.id, onDone, progress]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: progress.interpolate({ inputRange: [0, 1], outputRange: [0, width] }),
        height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, CHIP_HEIGHT] }),
        // Closing the gaps it takes with it leaves the surviving chips exactly where they belong.
        marginLeft: progress.interpolate({ inputRange: [0, 1], outputRange: [collapseBefore ? -CHIP_GAP : 0, 0] }),
        marginRight: progress.interpolate({ inputRange: [0, 1], outputRange: [collapseAfter ? -CHIP_GAP : 0, 0] }),
        opacity: progress,
        overflow: "hidden",
      }}
    >
      <Animated.View
        className="h-10 flex-row items-center gap-2 rounded-full border border-border bg-muted px-3.5"
        style={{
          width,
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [CHIP_PRESS_SCALE, 1] }) }],
        }}
      >
        <ChipBody label={chip.label} />
      </Animated.View>
    </Animated.View>
  );
}

type Row = { chip: Chip; ghost?: Ghost };

/** The filters that are on, as chips that each remove their own filter. */
export function ActiveFilterChips({ chips, onRemove }: ChipsProps) {
  const reducedMotion = useReducedMotion();
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const layouts = useRef<Partial<Record<FilterId, LayoutRectangle>>>({});

  const dismiss = useCallback((id: FilterId) => {
    setGhosts((current) => current.filter((ghost) => ghost.id !== id));
  }, []);

  const remove = (chip: Chip) => {
    const layout = layouts.current[chip.id];
    // Reduced motion removes straight away; no measured width means nothing to collapse either.
    if (layout && !reducedMotion) {
      setGhosts((current) =>
        current.some((ghost) => ghost.id === chip.id) ? current : [...current, { ...chip, width: layout.width }],
      );
    }
    onRemove(chip.id);
  };

  const byId = new Map(chips.map((chip) => [chip.id, chip]));
  const ghostById = new Map(ghosts.map((ghost) => [ghost.id, ghost]));

  // The fixed order keeps a collapsing chip in its slot however many chips leave together.
  const rows = FILTER_ORDER.flatMap((id): Row[] => {
    const ghost = ghostById.get(id);
    if (ghost) return [{ chip: ghost, ghost }];
    const chip = byId.get(id);
    return chip ? [{ chip }] : [];
  });

  // One gap disappears with each removed chip, bar the last one when nothing else is left.
  let gapsToCollapse = chips.length > 0 ? ghosts.length : Math.max(0, ghosts.length - 1);
  const collapses = new Map<FilterId, { before: boolean; after: boolean }>();
  rows.forEach((row, index) => {
    if (!row.ghost) return;

    const after = index < rows.length - 1 && gapsToCollapse > 0;
    if (after) gapsToCollapse -= 1;
    const before = !after && index > 0 && gapsToCollapse > 0;
    if (before) gapsToCollapse -= 1;
    collapses.set(row.ghost.id, { before, after });
  });

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 grow-0" contentContainerClassName="gap-2 px-4">
      {rows.map(({ chip, ghost }) =>
        ghost ? (
          <ExitingChip
            key={`exiting-${chip.id}`}
            chip={chip}
            width={ghost.width}
            collapseBefore={collapses.get(chip.id)?.before ?? false}
            collapseAfter={collapses.get(chip.id)?.after ?? false}
            onDone={dismiss}
          />
        ) : (
          <Pressable
            key={chip.id}
            accessibilityRole="button"
            accessibilityLabel={`${chip.label}, remove`}
            onPress={() => remove(chip)}
            onLayout={(event) => {
              layouts.current[chip.id] = event.nativeEvent.layout;
            }}
            className="h-10 flex-row items-center gap-2 rounded-full border border-border bg-muted px-3.5"
          >
            <ChipBody label={chip.label} />
          </Pressable>
        ),
      )}
    </ScrollView>
  );
}
