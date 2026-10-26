import { View } from "react-native";
import { Text } from "@/components/ui";

/** ATM IV, 30d RV and the other numbers the score was built on, as small outlined chips that wrap. */
export function ContextBadges({ badges }: { badges: { label: string; value: string }[] }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {badges.map((badge) => (
        <View
          key={badge.label}
          accessible
          accessibilityLabel={`${badge.label} ${badge.value}`}
          className="h-6 flex-row items-center gap-1 rounded-md border border-border px-2"
        >
          <Text size="xs" tone="muted">
            {badge.label}
          </Text>
          <Text size="xs" mono>
            {badge.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
