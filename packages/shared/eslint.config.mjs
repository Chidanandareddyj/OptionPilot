import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  {
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react", message: "packages/shared cannot depend on React." },
            { name: "react-native", message: "packages/shared cannot depend on React Native." },
            { name: "next", message: "packages/shared cannot depend on Next.js." },
          ],
          patterns: [
            {
              group: ["react/*", "react-native/*", "next/*", "node:*", "@prisma/*", "prisma", "prisma/*"],
              message: "packages/shared is pure TypeScript.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message: "packages/shared cannot read process.env.",
        },
      ],
    },
  },
]);

export default eslintConfig;
