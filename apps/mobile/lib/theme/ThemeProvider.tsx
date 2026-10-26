import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Uniwind, useUniwind } from "uniwind";
import { themeColors, type Scheme, type ThemeColors } from "./colors";

export type Appearance = "system" | "dark" | "light";

export const APPEARANCE_STORAGE_KEY = "optionpilot.appearance";

const APPEARANCES: readonly Appearance[] = ["system", "dark", "light"];

function isAppearance(value: string | null): value is Appearance {
  return APPEARANCES.includes(value as Appearance);
}

type ThemeContextValue = {
  /** What the user chose in Appearance. */
  appearance: Appearance;
  /** The theme in use. For `system` this follows the phone. */
  scheme: Scheme;
  colors: ThemeColors;
  /** False until the saved choice has been read, so the splash can wait. */
  isReady: boolean;
  setAppearance: (next: Appearance) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>("system");
  const [isReady, setIsReady] = useState(false);
  const { theme } = useUniwind();
  const scheme: Scheme = theme === "dark" ? "dark" : "light";

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(APPEARANCE_STORAGE_KEY)
      .then((saved) => {
        if (active && isAppearance(saved)) {
          setAppearanceState(saved);
          Uniwind.setTheme(saved);
        }
      })
      .catch(() => {
        // An unreadable preference falls back to following the phone.
      })
      .finally(() => {
        if (active) setIsReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setAppearance = useCallback((next: Appearance) => {
    setAppearanceState(next);
    Uniwind.setTheme(next);
    AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, next).catch(() => {
      // The choice still applies for this session if saving fails.
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ appearance, scheme, colors: themeColors[scheme], isReady, setAppearance }),
    [appearance, scheme, isReady, setAppearance],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
