import { useEffect, useState } from "react";
import { Animated, type DimensionValue, type ViewStyle } from "react-native";

type SkeletonProps = { width?: DimensionValue; height: number; radius?: number; style?: ViewStyle };

/** A grey placeholder block that pulses while content loads. */
export function Skeleton({ width = "100%", height, radius = 8, style }: SkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="bg-accent"
      style={[{ width, height, borderRadius: radius, opacity }, style]}
    />
  );
}
