import MaskedViewNative from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentType, ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { useTheme } from "@/lib/theme/ThemeProvider";
import type { TextSize } from "@/lib/theme/typography";
import { Text } from "./Text";

// The package's own typings no longer match React Native 0.88's NativeMethods, so type it here.
const MaskedView = MaskedViewNative as unknown as ComponentType<
  ViewProps & { maskElement: ReactElement }
>;

type GradientTextProps = { children: string; size?: TextSize };

/** Headline filled with the website's hero gradient. The gradient runs across the full width. */
export function GradientText({ children, size = "4xl" }: GradientTextProps) {
  const { colors } = useTheme();
  const label = (
    <Text size={size} weight="semibold" tight>
      {children}
    </Text>
  );
  return (
    <MaskedView maskElement={label} accessibilityRole="header" accessibilityLabel={children}>
      <LinearGradient
        colors={[colors.heroFrom, colors.heroTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={{ opacity: 0 }}>{label}</View>
      </LinearGradient>
    </MaskedView>
  );
}
