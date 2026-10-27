import { View } from "react-native";
import { Skeleton } from "@/components/ui";

/** Four grey cards in the shape of contract cards, shown until the first prices arrive. */
export function BoardSkeleton() {
  return (
    <View className="gap-3" accessibilityLabel="Waiting for prices" accessibilityRole="progressbar">
      {[0, 1, 2, 3].map((n) => (
        <View key={n} className="gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
          <View className="flex-row items-center justify-between">
            <Skeleton width={96} height={20} />
            <Skeleton width={40} height={20} />
          </View>
          <Skeleton width="76%" height={10} />
          <View className="flex-row justify-between">
            <Skeleton width={72} height={32} radius={10} />
            <Skeleton width={72} height={32} radius={10} />
            <Skeleton width={72} height={32} radius={10} />
          </View>
        </View>
      ))}
    </View>
  );
}
