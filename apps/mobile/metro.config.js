// Metro setup for the npm workspace. Expo's default config already watches the workspace root and
// resolves hoisted packages, so only Uniwind (Tailwind v4 for React Native) is added here.
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

// withUniwindConfig must be the outermost wrapper.
module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
});
