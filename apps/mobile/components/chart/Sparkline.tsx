import { View } from "react-native";
import Svg, { ClipPath, Defs, Line, Path, Rect } from "react-native-svg";
import type { NormalizedStrategy } from "@optionpilot/shared";
import { sparkline } from "@/lib/chart/spark";
import { useTheme } from "@/lib/theme/ThemeProvider";

type SparklineProps = { strategy: NormalizedStrategy; width: number; height: number };

/** A tiny payoff curve: green above the zero line, red below it. Decoration, so hidden from screen readers. */
export function Sparkline({ strategy, width, height }: SparklineProps) {
  const { colors } = useTheme();
  const spark = sparkline(strategy, width, height);
  if (!spark) return <View style={{ width, height }} />;
  const id = strategy.key;
  return (
    <Svg width={width} height={height} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        <ClipPath id={`above-${id}`}>
          <Rect x={0} y={0} width={width} height={spark.zeroY} />
        </ClipPath>
        <ClipPath id={`below-${id}`}>
          <Rect x={0} y={spark.zeroY} width={width} height={height - spark.zeroY} />
        </ClipPath>
      </Defs>
      <Line x1={2} x2={width - 2} y1={spark.zeroY} y2={spark.zeroY} stroke={colors.border} strokeWidth={1} strokeDasharray="2 3" />
      <Path d={spark.d} fill="none" stroke={colors.profit} strokeWidth={1.75} strokeLinejoin="round" clipPath={`url(#above-${id})`} />
      <Path d={spark.d} fill="none" stroke={colors.loss} strokeWidth={1.75} strokeLinejoin="round" clipPath={`url(#below-${id})`} />
    </Svg>
  );
}
