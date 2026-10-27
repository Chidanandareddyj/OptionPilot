import { Pressable, View } from "react-native";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { surfaceColors } from "@/lib/theme/colors";
import { useScreenInsets } from "@/lib/safe-area";
import { useTheme } from "@/lib/theme/ThemeProvider";
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

export function FloatingTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { colors, scheme } = useTheme();
  const insets = useScreenInsets();
  const surface = surfaceColors(scheme);

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
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = index === state.index;
          const Icon = tab.icon;
          const onPress = () => {
            const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          return (
            <Pressable
              key={route.key}
              role="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              className={`h-[54px] flex-1 items-center justify-center gap-0.5 rounded-full ${focused ? "bg-accent" : ""}`}
            >
              <Icon
                size={24}
                weight={focused ? "fill" : "regular"}
                color={focused ? colors.primary : colors.mutedForeground}
              />
              <Text size="xs" weight={focused ? "semibold" : "medium"} tone={focused ? "foreground" : "muted"}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
