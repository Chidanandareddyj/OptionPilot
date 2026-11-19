import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Animated, StyleSheet, View, type LayoutRectangle } from "react-native";
import { CHIP_PRESS_SCALE, TAB_BAR_FADE_MS, TAB_BAR_SLIDE_MS, TAB_EASE, TAB_PRESS_MS } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * The motion the dock uses, shared by the chips and segments that select one of a row.
 * All of it needs measured layouts: until they arrive the caller keeps its plain selected
 * fill, which is also what keeps the controls usable where layout events never fire (Jest).
 */

function sameLayout(a: LayoutRectangle, b: LayoutRectangle) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

/**
 * Tracks where each option sits and slides one `translateX` between them. The first
 * placement is set in a layout effect so the pill never flashes at x = 0; a key change
 * afterwards slides, and a plain re-measure snaps to stay glued to the option.
 */
export function useSelectionPill(selectedKey: string) {
  const [layouts, setLayouts] = useState<Record<string, LayoutRectangle>>({});
  const [translateX] = useState(() => new Animated.Value(0));
  const [sliding, setSliding] = useState(false);
  const lastKey = useRef<string | null>(null);
  const reducedMotion = useReducedMotion();
  const selected = layouts[selectedKey];

  const measure = useCallback((key: string, layout: LayoutRectangle) => {
    setLayouts((current) => {
      const previous = current[key];
      if (previous && sameLayout(previous, layout)) return current;
      return { ...current, [key]: layout };
    });
  }, []);

  useLayoutEffect(() => {
    if (!selected) return;

    const changedKey = lastKey.current !== null && lastKey.current !== selectedKey;
    lastKey.current = selectedKey;

    if (!changedKey || reducedMotion) {
      setSliding(false);
      translateX.setValue(selected.x);
    } else {
      setSliding(true);
      Animated.timing(translateX, {
        toValue: selected.x,
        duration: TAB_BAR_SLIDE_MS,
        easing: TAB_EASE,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setSliding(false);
      });
    }
  }, [reducedMotion, selected, selectedKey, translateX]);

  return { layout: selected, translateX, measure, reducedMotion, sliding };
}

type SelectionPillProps = {
  layout: LayoutRectangle | undefined;
  translateX: Animated.Value;
  color: string;
  /** Corner radius; defaults to a full pill. */
  radius?: number;
};

/** The fill behind the selected option. Rendered only once its option has been measured. */
export function SelectionPill({ layout, translateX, color, radius }: SelectionPillProps) {
  if (!layout) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        top: layout.y,
        width: layout.width,
        height: layout.height,
        borderRadius: radius ?? layout.height / 2,
        backgroundColor: color,
        transform: [{ translateX }],
      }}
    />
  );
}

type CrossfadeLabelProps = {
  selected: boolean;
  reducedMotion: boolean;
  /** The selected styling. It stays in the flow, so a chip keeps this width in both states. */
  active: ReactNode;
  /** The unselected styling, stacked on top of the active layer. */
  inactive: ReactNode;
};

/**
 * Two stacked labels: text colour cannot run on the native driver, so the styled layers
 * crossfade instead. Keeping the active layer in the flow means selecting a chip never
 * changes its width, which would otherwise move the pill's target under it.
 */
export function CrossfadeLabel({ selected, reducedMotion, active, inactive }: CrossfadeLabelProps) {
  const [focus] = useState(() => new Animated.Value(selected ? 1 : 0));
  const target = useRef(selected ? 1 : 0);

  useEffect(() => {
    const next = selected ? 1 : 0;
    if (target.current === next) return;
    target.current = next;

    Animated.timing(focus, {
      toValue: next,
      duration: reducedMotion ? 0 : TAB_BAR_FADE_MS,
      easing: TAB_EASE,
      useNativeDriver: true,
    }).start();
  }, [focus, reducedMotion, selected]);

  const inactiveOpacity = focus.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View>
      <Animated.View style={{ opacity: focus }}>{active}</Animated.View>
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="flex-row items-center justify-center"
        style={[StyleSheet.absoluteFill, { opacity: inactiveOpacity }]}
      >
        {inactive}
      </Animated.View>
    </View>
  );
}

/** Press feedback for a chip: 0.96 in and back, both in the dock's press duration. */
export function usePressScale(reducedMotion: boolean) {
  const [scale] = useState(() => new Animated.Value(1));

  const pressTo = (toValue: number) =>
    Animated.timing(scale, {
      toValue,
      duration: TAB_PRESS_MS,
      easing: TAB_EASE,
      useNativeDriver: true,
    }).start();

  return {
    scale,
    onPressIn: () => {
      if (!reducedMotion) pressTo(CHIP_PRESS_SCALE);
    },
    onPressOut: () => pressTo(1),
  };
}
