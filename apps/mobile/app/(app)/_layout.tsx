import { Stack } from "expo-router";
import { AnalyzeFlowProvider } from "@/lib/analysis/AnalyzeFlow";
import { QueryProvider } from "@/lib/api/QueryProvider";
import { BoardStateProvider } from "@/lib/derivatives/BoardState";
import { FeedProvider } from "@/lib/derivatives/FeedProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";

export default function AppLayout() {
  const { colors } = useTheme();
  // The query cache lives here, so signing out drops everything fetched for the account.
  return (
    <QueryProvider>
      <AnalyzeFlowProvider>
        <BoardStateProvider>
          <FeedProvider>
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
                name="derivatives/filters"
                options={{
                  presentation: "formSheet",
                  sheetAllowedDetents: "fitToContents",
                  sheetGrabberVisible: true,
                  sheetCornerRadius: 24,
                  contentStyle: { backgroundColor: colors.card },
                }}
              />
              <Stack.Screen
                name="derivatives/contract/[key]"
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
              <Stack.Screen name="settings/account" />
              <Stack.Screen name="settings/security" />
              <Stack.Screen name="settings/organizations" />
              <Stack.Screen
                name="settings/avatar"
                options={{ presentation: "transparentModal", animation: "fade", contentStyle: { backgroundColor: "transparent" } }}
              />
              <Stack.Screen
                name="settings/create-organization"
                options={{
                  presentation: "formSheet",
                  sheetAllowedDetents: "fitToContents",
                  sheetGrabberVisible: true,
                  sheetCornerRadius: 24,
                  contentStyle: { backgroundColor: colors.card },
                }}
              />
              <Stack.Screen
                name="settings/delete-account"
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
          </FeedProvider>
        </BoardStateProvider>
      </AnalyzeFlowProvider>
    </QueryProvider>
  );
}
