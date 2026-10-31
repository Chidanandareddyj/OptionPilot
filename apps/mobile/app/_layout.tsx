import "../global.css";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { configurePush } from "@/lib/notifications/push";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useAppFonts } from "@/lib/fonts";
import { OnboardingProvider, useOnboarding } from "@/lib/onboarding";
import { ThemeProvider, useTheme } from "@/lib/theme/ThemeProvider";
import { BrandedSplash } from "@/components/brand/BrandedSplash";

// Keep the native splash image up until the branded hold below has drawn its first frame.
SplashScreen.preventAutoHideAsync().catch(() => {});

/** The branded splash stays for at least this long so it does not flash by. */
const MIN_SPLASH_MS = 800;

export default function RootLayout() {
  useEffect(() => configurePush(), []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <OnboardingProvider>
            <AuthProvider>
              <Root />
            </AuthProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Root() {
  const { scheme, colors, isReady: themeReady } = useTheme();
  const { seen, isReady: onboardingReady } = useOnboarding();
  const { user, isReady: authReady } = useAuth();
  const signedIn = user !== null;
  const fontsReady = useAppFonts();
  const [holdElapsed, setHoldElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHoldElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  const ready = fontsReady && themeReady && onboardingReady && authReady && holdElapsed;

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {ready ? (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Protected guard={!seen} redirectTo={signedIn ? "/terminal" : "/sign-in"}>
            <Stack.Screen name="(onboarding)" />
          </Stack.Protected>
          <Stack.Protected guard={seen && !signedIn} redirectTo="/terminal">
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected guard={seen && signedIn} redirectTo={seen ? "/sign-in" : "/"}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
        </Stack>
      ) : (
        <BrandedSplash onLayout={() => SplashScreen.hideAsync().catch(() => {})} />
      )}
    </>
  );
}
