import { useId } from "react";
import Svg, { Circle, ClipPath, Defs, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { surfaceColors } from "@/lib/theme/colors";
import { useTheme } from "@/lib/theme/ThemeProvider";

const W = 326;
const H = 220;
const LEFT = 16;
const RIGHT = 16;
const TOP = 24;
const BOTTOM = 40;
const Y_MAX = 6800;
const Y_MIN = -5600;
const MAX_LOSS = -4300;
const MAX_PROFIT = 5700;
const LOW_STRIKE = 0.36;
const HIGH_STRIKE = 0.64;
const MONO = "GeistMono_600SemiBold";

const x = (u: number) => LEFT + u * (W - LEFT - RIGHT);
const y = (value: number) => TOP + ((Y_MAX - value) / (Y_MAX - Y_MIN)) * (H - TOP - BOTTOM);

/** The bull call spread payoff drawn as a clean line, used on the first onboarding slide. */
export function PayoffHero() {
  const { colors, scheme } = useTheme();
  const fills = surfaceColors(scheme);
  const id = useId().replace(/:/g, "");
  const zero = y(0);
  const breakeven = LOW_STRIKE + ((0 - MAX_LOSS) / (MAX_PROFIT - MAX_LOSS)) * (HIGH_STRIKE - LOW_STRIKE);

  const points = [
    [x(0), y(MAX_LOSS)],
    [x(LOW_STRIKE), y(MAX_LOSS)],
    [x(HIGH_STRIKE), y(MAX_PROFIT)],
    [x(1), y(MAX_PROFIT)],
  ];
  const line = points.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(" L ");
  const area = `M ${line} L ${x(1).toFixed(1)},${zero.toFixed(1)} L ${x(0).toFixed(1)},${zero.toFixed(1)} Z`;

  return (
    <Svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      style={{ aspectRatio: W / H }}
      accessibilityRole="image"
      accessibilityLabel="Bull call spread payoff: maximum loss 4,300, breakeven 1,188.60, maximum profit 5,700"
    >
      <Defs>
        <ClipPath id={`up${id}`}>
          <Rect x={0} y={0} width={W} height={zero} />
        </ClipPath>
        <ClipPath id={`down${id}`}>
          <Rect x={0} y={zero} width={W} height={H} />
        </ClipPath>
      </Defs>
      <Path d={area} fill={fills.profitFill} clipPath={`url(#up${id})`} />
      <Path d={area} fill={fills.lossFill} clipPath={`url(#down${id})`} />
      <Line x1={LEFT} x2={W - RIGHT} y1={zero} y2={zero} stroke={colors.faint} strokeWidth={1} />
      <Path
        d={`M ${line}`}
        fill="none"
        stroke={colors.foreground}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx={x(LOW_STRIKE)} cy={y(MAX_LOSS)} r={5} fill={colors.card} stroke={colors.foreground} strokeWidth={2} />
      <Circle cx={x(HIGH_STRIKE)} cy={y(MAX_PROFIT)} r={5} fill={colors.card} stroke={colors.foreground} strokeWidth={2} />
      <Circle cx={x(breakeven)} cy={zero} r={6} fill={colors.primary} stroke={colors.card} strokeWidth={2} />
      <SvgText x={x(1) - 4} y={y(MAX_PROFIT) - 12} textAnchor="end" fontSize={14} fontFamily={MONO} fill={colors.profit}>
        Max profit +5,700
      </SvgText>
      <SvgText x={x(0) + 4} y={y(MAX_LOSS) + 26} fontSize={14} fontFamily={MONO} fill={colors.loss}>
        Max loss −4,300
      </SvgText>
      {/* The halo is a thicker card-coloured copy underneath, since SVG paint-order is not available. */}
      <SvgText
        x={x(breakeven) - 12}
        y={zero - 12}
        textAnchor="end"
        fontSize={12}
        fontFamily="GeistMono_400Regular"
        fill={colors.card}
        stroke={colors.card}
        strokeWidth={4}
        strokeLinejoin="round"
      >
        Breakeven 1,188.60
      </SvgText>
      <SvgText
        x={x(breakeven) - 12}
        y={zero - 12}
        textAnchor="end"
        fontSize={12}
        fontFamily="GeistMono_400Regular"
        fill={colors.foreground}
      >
        Breakeven 1,188.60
      </SvgText>
    </Svg>
  );
}
