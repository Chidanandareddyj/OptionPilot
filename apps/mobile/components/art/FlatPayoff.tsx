import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import { useTheme } from "@/lib/theme/ThemeProvider";

const W = 310;
const H = 128;

/** A payoff with nothing on it, drawn on the 404 screen. */
export function FlatPayoff() {
  const { colors } = useTheme();
  return (
    <Svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      style={{ aspectRatio: W / H }}
      accessibilityRole="image"
      accessibilityLabel="A flat payoff line with nothing on it"
    >
      <Line x1={0} x2={W} y1={H / 2} y2={H / 2} stroke={colors.foreground} strokeWidth={2.5} />
      <Circle cx={W / 2} cy={H / 2} r={6} fill={colors.primary} />
      <SvgText x={W / 2} y={H / 2 - 20} textAnchor="middle" fontSize={12} fontFamily="Geist_400Regular" fill={colors.mutedForeground}>
        No payoff here
      </SvgText>
      <SvgText x={W / 2} y={H / 2 + 28} textAnchor="middle" fontSize={12} fontFamily="GeistMono_400Regular" fill={colors.faint}>
        0
      </SvgText>
    </Svg>
  );
}
