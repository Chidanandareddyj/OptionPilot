import type { ConfigContext, ExpoConfig } from "expo/config";
// Imported by path, with the extension, because Expo reads this file with Node before Metro runs and
// Node cannot resolve the extensionless imports inside the package index.
import { semantic } from "../../packages/shared/src/theme/semantic.ts";

/** Android package and iOS bundle identifier. */
const APP_ID = "tech.optionpilot.app";

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
  // EAS project id, Apple team id and Google service account are not available yet. They are
  // filled in when the Expo project is created (phase 13): `eas init` writes extra.eas.projectId.
});
