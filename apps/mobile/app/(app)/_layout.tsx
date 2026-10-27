import { Stack } from "expo-router";
import { AnalyzeFlowProvider } from "@/lib/analysis/AnalyzeFlow";
import { QueryProvider } from "@/lib/api/QueryProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";

export default function AppLayout() {
  const { colors } = useTheme();
  // The query cache lives here, so signing out drops everything fetched for the account.
  return (
    <QueryProvider>
      <AnalyzeFlowProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="search"
            options={{
              presentation: "formSheet",
              sheetAllowedDetents: [0.93],
              sheetGrabberVisible: true,
              sheetCornerRadius: 24,
              contentStyle: { backgroundColor: colors.card },
            }}
          />
          <Stack.Screen name="analysis/new" />
          <Stack.Screen name="analysis/[id]/index" />
          <Stack.Screen name="analysis/[id]/compare" />
          <Stack.Screen name="analysis/[id]/recommendation" />
          <Stack.Screen
            name="analysis/[id]/recommend"
            options={{
              presentation: "formSheet",
              sheetAllowedDetents: "fitToContents",
              sheetGrabberVisible: true,
              sheetCornerRadius: 24,
              contentStyle: { backgroundColor: colors.card },
            }}
          />
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
      </AnalyzeFlowProvider>
    </QueryProvider>
  );
}
