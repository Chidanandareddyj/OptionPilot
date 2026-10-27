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

export const ONBOARDING_STORAGE_KEY = "optionpilot.onboarding-seen";

type OnboardingContextValue = {
  /** False until the saved flag has been read. */
  isReady: boolean;
  seen: boolean;
  complete: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

/** Remembers that the three intro screens were shown, so they appear once. */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)
      .then((value) => {
        if (active) setSeen(value === "1");
      })
      .catch(() => {
        // If storage is unreadable the intro simply shows again.
      })
      .finally(() => {
        if (active) setIsReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const complete = useCallback(() => {
    setSeen(true);
    AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "1").catch(() => {
      // Seeing the intro again after a storage failure is harmless.
    });
  }, []);

  const value = useMemo(() => ({ isReady, seen, complete }), [isReady, seen, complete]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return value;
}
