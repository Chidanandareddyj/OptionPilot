import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View, type LayoutRectangle } from "react-native";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { surfaceColors } from "@/lib/theme/colors";
import { useScreenInsets } from "@/lib/safe-area";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { TAB_BAR_FADE_MS, TAB_BAR_SLIDE_MS, TAB_EASE, TAB_PRESS_MS } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import {
  ChartLineUpIcon,
  ClockCounterClockwiseIcon,
  GearSixIcon,
  ListMagnifyingGlassIcon,
  type PhosphorIcon,
} from "@/components/icons";
import { Text } from "@/components/ui";

type TabDefinition = { label: string; icon: PhosphorIcon };

/** Route name to label and icon. The order of the tabs comes from the navigator. */
export const TABS: Record<string, TabDefinition> = {
  terminal: { label: "Terminal", icon: ChartLineUpIcon },
  derivatives: { label: "Derivatives", icon: ListMagnifyingGlassIcon },
  history: { label: "History", icon: ClockCounterClockwiseIcon },
  settings: { label: "Settings", icon: GearSixIcon },
};

/** Room the bar takes at the bottom of a screen: height 64 plus its offset and a gap. */
export const TAB_BAR_CLEARANCE = 112;

type DockTabProps = {
  label: string;
  icon: PhosphorIcon;
  focused: boolean;
  /** Keeps the accent background on the item until the sliding pill has a measured position. */
  fallback: boolean;
  activeIconColor: string;
  inactiveIconColor: string;
  onLayout: (layout: LayoutRectangle) => void;
  onPress: () => void;
};

function DockTab({
  label,
  icon: Icon,
  focused,
  fallback,
  activeIconColor,
  inactiveIconColor,
  onLayout,
  onPress,
}: DockTabProps) {
  const [focus] = useState(() => new Animated.Value(focused ? 1 : 0));
  const [press] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.timing(focus, {
      toValue: focused ? 1 : 0,
      duration: TAB_BAR_FADE_MS,
      easing: TAB_EASE,
      useNativeDriver: true,
    }).start();
  }, [focus, focused]);

  const inactiveOpacity = focus.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  const pressTo = (toValue: number) => {
    Animated.timing(press, {
      toValue,
      duration: TAB_PRESS_MS,
      easing: TAB_EASE,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      role="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      onPressIn={() => pressTo(0.95)}
      onPressOut={() => pressTo(1)}
      onLayout={(event) => onLayout(event.nativeEvent.layout)}
      className={`h-[54px] flex-1 items-center justify-center gap-0.5 rounded-full ${focused && fallback ? "bg-accent" : ""}`}
    >
      <Animated.View
        className="items-center justify-center gap-0.5"
        style={{ transform: [{ scale: press }] }}
      >
        <View className="h-6 w-6 items-center justify-center">
          <Animated.View
            pointerEvents="none"
            className="items-center justify-center"
            style={[StyleSheet.absoluteFill, { opacity: inactiveOpacity }]}
          >
            <Icon size={24} weight="regular" color={inactiveIconColor} />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            className="items-center justify-center"
            style={[StyleSheet.absoluteFill, { opacity: focus }]}
          >
            <Icon size={24} weight="fill" color={activeIconColor} />
          </Animated.View>
        </View>

        <View className="items-center justify-center">
          <Animated.View style={{ opacity: focus }}>
            <Text size="xs" weight="semibold" tone="foreground">
              {label}
            </Text>
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            className="items-center justify-center"
            style={[StyleSheet.absoluteFill, { opacity: inactiveOpacity }]}
          >
            <Text size="xs" weight="medium" tone="muted">
              {label}
            </Text>
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function FloatingTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { colors, scheme } = useTheme();
  const insets = useScreenInsets();
  const surface = surfaceColors(scheme);
  const reducedMotion = useReducedMotion();

  const [layouts, setLayouts] = useState<Record<string, LayoutRectangle>>({});
  const [pillX] = useState(() => new Animated.Value(0));
  const lastIndex = useRef<number | null>(null);

  const activeRoute = state.routes[state.index];
  const activeLayout = activeRoute ? layouts[activeRoute.key] : undefined;

  const handleLayout = useCallback((key: string, layout: LayoutRectangle) => {
    setLayouts((current) => {
      const previous = current[key];
      if (
        previous &&
        previous.x === layout.x &&
        previous.y === layout.y &&
        previous.width === layout.width &&
        previous.height === layout.height
      ) {
        return current;
      }
      return { ...current, [key]: layout };
    });
  }, []);

  // A layout effect sets the pill's first position before the frame is painted; later tabs slide.
  useLayoutEffect(() => {
    if (!activeLayout) return;

    const changedTab = lastIndex.current !== null && lastIndex.current !== state.index;
    lastIndex.current = state.index;

    if (!changedTab || reducedMotion) {
      pillX.setValue(activeLayout.x);
    } else {
      Animated.timing(pillX, {
        toValue: activeLayout.x,
        duration: TAB_BAR_SLIDE_MS,
        easing: TAB_EASE,
        useNativeDriver: true,
      }).start();
    }
  }, [activeLayout, pillX, reducedMotion, state.index]);

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-4"
      style={{ bottom: insets.bottom > 0 ? insets.bottom - 6 : 16 }}
    >
      <View
        role="tablist"
        className="h-16 flex-row items-center gap-1 rounded-full border border-border p-1"
        style={{
          backgroundColor: surface.glass,
          shadowColor: surface.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 1,
          shadowRadius: 24,
          elevation: 12,
        }}
      >
        {activeLayout ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: activeLayout.y,
              width: activeLayout.width,
              height: activeLayout.height,
              borderRadius: activeLayout.height / 2,
              backgroundColor: colors.accent,
              transform: [{ translateX: pillX }],
            }}
          />
        ) : null}
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = index === state.index;
          const onPress = () => {
            const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          return (
            <DockTab
              key={route.key}
              label={tab.label}
              icon={tab.icon}
              focused={focused}
              fallback={!activeLayout}
              activeIconColor={colors.primary}
              inactiveIconColor={colors.mutedForeground}
              onLayout={(layout) => handleLayout(route.key, layout)}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}
