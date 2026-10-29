import type { ConfigContext, ExpoConfig } from "expo/config";
// Imported by path, with the extension, because Expo reads this file with Node before Metro runs and
// Node cannot resolve the extensionless imports inside the package index.
import { semantic } from "../../packages/shared/src/theme/semantic.ts";

/** Android package and iOS bundle identifier. */
const APP_ID = "tech.optionpilot.app";

/**
 * Where the OptionPilot web app and its `/api/auth/*` proxy live. It must be the `www` host: the
 * apex is rejected as an Origin by the auth backend. Override with EXPO_PUBLIC_API_BASE_URL.
 */
const DEFAULT_API_BASE_URL = "https://www.optionpilot.tech";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "OptionPilot",
  slug: "optionpilot",
  scheme: "optionpilot",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: APP_ID,
    supportsTablet: false,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: APP_ID,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      monochromeImage: "./assets/adaptive-icon-monochrome.png",
      backgroundColor: semantic.saffron.background,
    },
  },
  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        // Shown as the Android notification colour. The permission reason is on the Notifications screen.
        color: semantic.saffron.primary,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "OptionPilot uses your photos so you can choose an avatar.",
        cameraPermission: "OptionPilot uses the camera so you can take a photo for your avatar.",
        microphonePermission: false,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon-light.png",
        imageWidth: 140,
        backgroundColor: semantic.paper.background,
        dark: {
          image: "./assets/splash-icon-dark.png",
          backgroundColor: semantic.saffron.background,
        },
      },
    ],
  ],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
    eas: { projectId: "5fda50b0-5603-4df3-a515-2ed60efbca8a" },
  },
  // Apple team id and Google service account are not available yet.
});
