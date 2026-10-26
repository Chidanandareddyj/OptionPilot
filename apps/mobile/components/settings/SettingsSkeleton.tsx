import { View } from "react-native";
import { Skeleton, Text } from "@/components/ui";

/** Design 57: placeholder cards while the account details load. */
export function SettingsSkeleton() {
  return (
    <View className="gap-3" testID="settings-loading">
      <View className="flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
        <View className="flex-1 gap-3">
          <Skeleton width="55%" height={24} />
          <Skeleton width="90%" height={16} />
        </View>
        <Skeleton width={64} height={64} radius={12} />
      </View>
      {[0, 1].map((index) => (
        <View key={index} className="gap-4 rounded-2xl border border-border bg-card p-4">
          <Skeleton width="42%" height={24} />
          <Skeleton height={16} />
          <Skeleton height={52} radius={12} />
        </View>
      ))}
      <Text size="sm" tone="muted" accessibilityLiveRegion="polite">
        Loading your account details.
      </Text>
    </View>
  );
}
