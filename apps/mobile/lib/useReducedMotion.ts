import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Tracks the OS "Reduce Motion" setting so large transitions can collapse to a fade. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduced(enabled);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
