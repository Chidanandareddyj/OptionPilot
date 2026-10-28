// Metro setup for the npm workspace. Resolve the shared source directly so Metro does not need to
// traverse the npm workspace junction in node_modules (which can fail on Windows).
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const path = require("node:path");

const config = getDefaultConfig(__dirname);
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@optionpilot/shared": path.resolve(__dirname, "../../packages/shared"),
};

// withUniwindConfig must be the outermost wrapper.
module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
});
