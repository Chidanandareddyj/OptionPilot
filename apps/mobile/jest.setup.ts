import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

// Uniwind is a Metro-transformed library. Tests only need its theme switch, which this fake keeps.
jest.mock("uniwind", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories cannot use imports
  const React = require("react");
  const listeners = new Set<() => void>();
  let current: "light" | "dark" = "dark";
  const state = { requested: "system" as string };
  const Uniwind = {
    setTheme: jest.fn((name: string) => {
      state.requested = name;
      current = name === "light" ? "light" : "dark";
      listeners.forEach((listener) => listener());
    }),
  };
  const useUniwind = () => {
    const [, tick] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => {
      listeners.add(tick);
      return () => {
        listeners.delete(tick);
      };
    }, []);
    return { theme: current, hasAdaptiveThemes: state.requested === "system" };
  };
  return { Uniwind, useUniwind, __reset: () => { current = "dark"; state.requested = "system"; } };
});
