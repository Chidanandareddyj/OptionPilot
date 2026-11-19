import { useMemo } from "react";
import { useWindowDimensions, View } from "react-native";
import { Tabs } from "expo-router/js-tabs";
import type { BottomTabNavigationOptions } from "expo-router/js-tabs";
import { FloatingTabBar } from "@/components/navigation/FloatingTabBar";
import { SwipeTabs } from "@/components/navigation/SwipeTabs";
import { TAB_EASE, TAB_TRANSITION_MS } from "@/lib/motion";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { useReducedMotion } from "@/lib/useReducedMotion";

export default function TabsLayout() {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();

  const screenOptions = useMemo<BottomTabNavigationOptions>(() => {
    if (reducedMotion) {
      return {
        headerShown: false,
        animation: "fade",
        sceneStyle: { backgroundColor: colors.background },
      };
    }

    const sceneStyleInterpolator: NonNullable<
      BottomTabNavigationOptions["sceneStyleInterpolator"]
    > = ({ current }) => ({
      sceneStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [-width, 0, width],
            }),
          },
        ],
      },
    });

    const transitionSpec: NonNullable<BottomTabNavigationOptions["transitionSpec"]> = {
      animation: "timing",
      config: {
        duration: TAB_TRANSITION_MS,
        easing: TAB_EASE,
      },
    };

    return {
      headerShown: false,
      animation: "shift",
      sceneStyleInterpolator,
      transitionSpec,
      sceneStyle: { backgroundColor: colors.background },
    };
  }, [colors.background, reducedMotion, width]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SwipeTabs>
        <Tabs
          tabBar={(props) => <FloatingTabBar {...props} />}
          screenOptions={screenOptions}
        >
          <Tabs.Screen name="terminal" options={{ title: "Terminal" }} />
          <Tabs.Screen name="derivatives" options={{ title: "Derivatives" }} />
          <Tabs.Screen name="history" options={{ title: "History" }} />
          <Tabs.Screen name="settings" options={{ title: "Settings" }} />
        </Tabs>
      </SwipeTabs>
    </View>
  );
}
