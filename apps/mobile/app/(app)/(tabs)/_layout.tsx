import { Tabs } from "expo-router/js-tabs";
import { FloatingTabBar } from "@/components/navigation/FloatingTabBar";
import { useTheme } from "@/lib/theme/ThemeProvider";

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="terminal" options={{ title: "Terminal" }} />
      <Tabs.Screen name="derivatives" options={{ title: "Derivatives" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
