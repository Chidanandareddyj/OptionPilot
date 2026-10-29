module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
  // The first test in a heavy screen file pays for the transform. Under a full parallel run that can take longer than Jest's 5s default.
  testTimeout: 60000,
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/dist-native/"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-native-svg|react-native-gesture-handler|@shopify/react-native-skia|@tanstack/.*|phosphor-react-native|expo-router|react-navigation|@react-navigation/.*|@optionpilot/.*))",
  ],
};
