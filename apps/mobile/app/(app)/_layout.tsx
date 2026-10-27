import { Stack } from "expo-router";
import { useTheme } from "@/lib/theme/ThemeProvider";

export default function AppLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="appearance"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: "fitToContents",
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
          contentStyle: { backgroundColor: colors.card },
        }}
      />
      <Stack.Screen
        name="sign-out"
        options={{ presentation: "transparentModal", animation: "fade", contentStyle: { backgroundColor: "transparent" } }}
      />
    </Stack>
  );
}
