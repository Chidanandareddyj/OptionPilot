import { View } from "react-native";
import { Card, Skeleton } from "@/components/ui";

/** Six grey rows in the shape of history rows, while the first page loads. */
export function HistorySkeleton() {
  return (
    <View className="gap-3" accessibilityLabel="Loading saved analyses" accessibilityRole="progressbar">
      {[0, 1, 2, 3, 4, 5].map((n) => (
        <Card key={n} className="gap-3 px-4 py-3.5">
          <View className="flex-row items-center justify-between">
            <Skeleton width={96} height={20} />
            <Skeleton width={71} height={20} />
          </View>
          <View className="flex-row items-center justify-between">
            <Skeleton width={120} height={25} />
            <Skeleton width={96} height={11} radius={6} />
          </View>
        </Card>
      ))}
    </View>
  );
}
