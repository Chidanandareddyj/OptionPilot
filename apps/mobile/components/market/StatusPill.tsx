import { View } from "react-native";
import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { MarketStatus } from "@/lib/market/status";

/** "NSE open 14:46 IST", "NSE closed" or "Offline", with a green or grey dot. Nothing until the status is known. */
export function StatusPill({ status }: { status: MarketStatus | null }) {
  if (!status) return null;
  return (
    <View
      accessible
      accessibilityLabel={status.kind === "open" ? `${status.label} ${status.clock} IST` : status.label}
      className="flex-row items-center gap-2"
    >
      <View className={cn("h-2 w-2 rounded-full", status.kind === "open" ? "bg-profit" : "bg-faint")} />
      <Text size="sm" tone="muted">
        {status.label}
      </Text>
      {status.kind === "open" ? (
        <Text size="sm" tone="muted" mono>
          {status.clock} IST
        </Text>
      ) : null}
    </View>
  );
}
