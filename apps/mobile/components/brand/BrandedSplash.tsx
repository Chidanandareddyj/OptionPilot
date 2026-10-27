import { useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { useScreenInsets } from "@/lib/safe-area";
import { Text } from "@/components/ui";
import { BrandMark } from "./BrandMark";

const TRACK_WIDTH = 128;
const BAR_WIDTH = 44;

/**
 * Shown while fonts and the saved settings load, right after the native splash image. The native
 * splash can only show a static logo, so this carries the name and the loading bar.
 */
export function BrandedSplash({ onLayout }: { onLayout?: () => void }) {
  const insets = useScreenInsets();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-BAR_WIDTH, TRACK_WIDTH],
  });

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background" onLayout={onLayout}>
      <BrandMark size={96} />
      <View className="items-center gap-2">
        <Text size="2xl" weight="semibold" tight>
          OptionPilot
        </Text>
        <Text size="sm" tone="muted">
          Loading OptionPilot…
        </Text>
      </View>
      <View
        className="h-1 overflow-hidden rounded-full bg-accent"
        style={{ width: TRACK_WIDTH }}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading"
      >
        <Animated.View
          className="h-1 rounded-full bg-primary"
          style={{ width: BAR_WIDTH, transform: [{ translateX }] }}
        />
      </View>
      <View className="absolute inset-x-0 items-center" style={{ bottom: insets.bottom + 30 }}>
        <Text size="xs" tone="faint">
          NSE · BSE · index F&amp;O
        </Text>
      </View>
    </View>
  );
}
