import { useCallback, useEffect, useState } from "react";

/** Counts whole seconds down from `seconds` to 0. `restart` starts it again. */
export function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  // A restart changes this, which re-runs the effect and so gives the timer a fresh start.
  const [run, setRun] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [run]);

  const restart = useCallback(() => {
    setRemaining(seconds);
    setRun((value) => value + 1);
  }, [seconds]);

  return { remaining, restart };
}

/** 28 becomes "0:28". */
export function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, "0")}`;
}
