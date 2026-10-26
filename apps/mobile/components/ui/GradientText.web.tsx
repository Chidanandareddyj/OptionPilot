import type { TextStyle } from "react-native";
import { useTheme } from "@/lib/theme/ThemeProvider";
import type { TextSize } from "@/lib/theme/typography";
import { Text } from "./Text";

type GradientTextProps = { children: string; size?: TextSize };

/** Web only (used for the visual check): clip a CSS gradient to the text. */
export function GradientText({ children, size = "4xl" }: GradientTextProps) {
  const { colors } = useTheme();
  const style = {
    backgroundImage: `linear-gradient(90deg, ${colors.heroFrom} 0%, ${colors.heroTo} 100%)`,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
  } as TextStyle;
  return (
    <Text size={size} weight="semibold" tight style={style} accessibilityRole="header">
      {children}
    </Text>
  );
}
