import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { AnalysisSkeleton } from "@/components/analysis/AnalysisSkeleton";
import { NavBar, useNavBarHeight } from "@/components/navigation/NavBar";
import { useAnalyzeFlow } from "@/lib/analysis/AnalyzeFlow";

/** Waits for the analysis the Terminal or the search sheet started, then opens it. A failure goes back to the Terminal's alert. */
export default function CalculatingScreen() {
  const router = useRouter();
  const { symbol } = useLocalSearchParams<{ symbol?: string }>();
  const { state, start, reset } = useAnalyzeFlow();
  const navHeight = useNavBarHeight();
  const started = useRef(false);
  const running = useRef(false);
  useEffect(() => {
    running.current = state.status === "running";
  }, [state.status]);

  // Opened with a symbol in the link (for example from a contract) and nothing running yet.
  useEffect(() => {
    if (started.current || state.status !== "idle" || !symbol) return;
    started.current = true;
    start(symbol);
  }, [state.status, symbol, start]);

  useEffect(() => {
    if (state.status === "done") router.replace({ pathname: "/analysis/[id]", params: { id: state.id } });
    else if (state.status === "failed") router.back();
    else if (state.status === "idle" && !symbol) router.replace("/");
  }, [state, symbol, router]);

  // Leaving while it still runs drops the request. A failure has to survive, so the Terminal can show it.
  useEffect(
    () => () => {
      if (running.current) reset();
    },
    [reset],
  );

  const shown = state.status === "idle" ? (symbol ?? "").toUpperCase() : state.symbol;

  return (
    <View className="flex-1 bg-background px-4" style={{ paddingTop: navHeight }}>
      <NavBar backLabel="Terminal" onBack={() => router.back()} />
      <AnalysisSkeleton symbol={shown || undefined} />
    </View>
  );
}
