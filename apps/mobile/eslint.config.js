const { defineConfig, globalIgnores } = require("eslint/config");
const expo = require("eslint-config-expo/flat");

module.exports = defineConfig([
  globalIgnores(["dist/*", "dist-native/*", ".expo/*", "uniwind-types.d.ts"]),
  expo,
  {
    // Windows can resolve workspace junctions through a different-cased absolute path.
    // Keep unresolved-module checks, but leave case validation to Metro and TypeScript.
    rules: {
      "import/no-unresolved": ["error", { caseSensitive: false }],
    },
  },
]);
