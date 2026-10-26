import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Line,
  Path,
  RoundedRect,
  Skia,
  Text as SkiaText,
  useFont,
  type SkFont,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { breakevenLabelVisible, CHART_BLEED, type Align, type ChartLayout, type ScrubReadout } from "@/lib/chart/layout";
import { surfaceColors, withAlpha } from "@/lib/theme/colors";
import { useTheme } from "@/lib/theme/ThemeProvider";

// Skia loads fonts from asset modules.
const SANS_REGULAR = require("@expo-google-fonts/geist/400Regular/Geist_400Regular.ttf");
const SANS_SEMIBOLD = require("@expo-google-fonts/geist/600SemiBold/Geist_600SemiBold.ttf");
const MONO_REGULAR = require("@expo-google-fonts/geist-mono/400Regular/GeistMono_400Regular.ttf");
const MONO_SEMIBOLD = require("@expo-google-fonts/geist-mono/600SemiBold/GeistMono_600SemiBold.ttf");

export type ChartCanvasProps = {
  layout: ChartLayout;
  /** The readout for a finger on the chart, or null when nothing is being read. */
  scrub: ScrubReadout | null;
};

type Fonts = { mono: SkFont; monoBold: SkFont; monoBold14: SkFont; sans: SkFont; sansBold: SkFont };

function useChartFonts(): Fonts | null {
  const mono = useFont(MONO_REGULAR, 12);
  const monoBold = useFont(MONO_SEMIBOLD, 12);
  const monoBold14 = useFont(MONO_SEMIBOLD, 14);
  const sans = useFont(SANS_REGULAR, 12);
  const sansBold = useFont(SANS_SEMIBOLD, 12);
  return mono && monoBold && monoBold14 && sans && sansBold ? { mono, monoBold, monoBold14, sans, sansBold } : null;
}

type LabelProps = {
  font: SkFont;
  text: string;
  x: number;
  y: number;
  color: string;
  align?: Align | "middle";
  /** A card-coloured outline that keeps the text legible over the curve and fills. */
  halo?: string;
};

const HALO_OFFSETS = [
  [-2, 0], [2, 0], [0, -2], [0, 2], [-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5],
] as const;

/** Text positioned by its baseline and aligned left, right or centred on x. */
function Label({ font, text, x, y, color, align = "start", halo }: LabelProps) {
  const width = font.measureText(text).width;
  const left = align === "end" ? x - width : align === "middle" ? x - width / 2 : x;
  return (
    <>
      {halo
        ? HALO_OFFSETS.map(([dx, dy]) => (
            <SkiaText key={`${dx},${dy}`} font={font} text={text} x={left + dx} y={y + dy} color={halo} />
          ))
        : null}
      <SkiaText font={font} text={text} x={left} y={y} color={color} />
    </>
  );
}

/**
 * Draws a payoff chart from a computed layout. No gestures or state live here: the layout holds
 * every position (see lib/chart/layout.ts), so this is only paint. A port of the design's SVG.
 */
export function ChartCanvas({ layout, scrub }: ChartCanvasProps) {
  const { colors, scheme } = useTheme();
  const fonts = useChartFonts();
  const fills = surfaceColors(scheme);
  const { plot, zeroY, width, height } = layout;

  const { curvePath, areaPath } = useMemo(() => {
    const first = layout.curve[0];
    const last = layout.curve[layout.curve.length - 1];
    const line = Skia.PathBuilder.Make();
    layout.curve.forEach((point, index) => {
      const x = layout.xOf(point.price);
      const y = layout.yOf(point.pnl);
      if (index === 0) line.moveTo(x, y);
      else line.lineTo(x, y);
    });
    const curve = line.build();
    if (!first || !last) return { curvePath: curve, areaPath: curve };
    // The fill closes along the zero line, so it can be clipped into a green and a red half.
    const area = Skia.PathBuilder.Make().addPath(curve);
    area.lineTo(layout.xOf(last.price), zeroY).lineTo(layout.xOf(first.price), zeroY).close();
    return { curvePath: curve, areaPath: area.build() };
  }, [layout, zeroY]);

  if (!fonts) return null;
  const border = withAlpha(colors.border, 0.7);
  const faintDim = withAlpha(colors.faint, 0.7);
  const axisY = plot.bottom;
  const nearest = scrub
    ? layout.ruler.reduce<number>(
        (best, tick, i) => (Math.abs(tick.price - scrub.price) < Math.abs(layout.ruler[best].price - scrub.price) ? i : best),
        0,
      )
    : -1;

  return (
    <Canvas style={{ width: width + 2 * CHART_BLEED, height }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Group transform={[{ translateX: CHART_BLEED }]}>
        {layout.yTicks.map((tick) => (
          <Group key={tick.value}>
            {tick.value === 0 ? null : (
              <Line p1={{ x: plot.left, y: tick.at }} p2={{ x: plot.right, y: tick.at }} color={border} strokeWidth={1} />
            )}
            <Label font={fonts.mono} text={tick.text} x={plot.left - 8} y={tick.at + 4} align="end" color={colors.faint} />
          </Group>
        ))}

        <Group clip={{ x: plot.left, y: plot.top, width: plot.right - plot.left, height: Math.max(0, zeroY - plot.top) }}>
          <Path path={areaPath} color={fills.profitFill} />
        </Group>
        <Group clip={{ x: plot.left, y: zeroY, width: plot.right - plot.left, height: Math.max(0, plot.bottom - zeroY) }}>
          <Path path={areaPath} color={fills.lossFill} />
        </Group>
        <Line p1={{ x: plot.left, y: zeroY }} p2={{ x: plot.right, y: zeroY }} color={colors.faint} strokeWidth={1} />

        {layout.strikes.map((strike) => (
          <Line key={`g${strike.x}`} p1={{ x: strike.x, y: plot.top }} p2={{ x: strike.x, y: plot.bottom }} color={faintDim} strokeWidth={1}>
            <DashPathEffect intervals={[2, 4]} />
          </Line>
        ))}

        {layout.spot ? (
          <Group>
            <Line p1={{ x: layout.spot.x, y: plot.top }} p2={{ x: layout.spot.x, y: plot.bottom }} color={colors.primary} strokeWidth={1.5}>
              <DashPathEffect intervals={[4, 4]} />
            </Line>
            <RoundedRect {...layout.spot.pill} r={6} color={colors.primary} />
            <Label
              font={fonts.monoBold}
              text={layout.spot.label}
              x={layout.spot.pill.x + layout.spot.pill.width / 2}
              y={18}
              align="middle"
              color={colors.primaryForeground}
            />
          </Group>
        ) : null}

        {layout.ruler.map((tick, i) => {
          const near = i === nearest;
          return (
            <Line
              key={`r${i}`}
              p1={{ x: tick.x, y: axisY }}
              p2={{ x: tick.x, y: axisY + (near ? 12 : tick.major ? 8 : 4) }}
              color={near ? colors.primary : tick.major ? colors.faint : colors.border}
              strokeWidth={near ? 2 : 1}
            />
          );
        })}
        {layout.xTicks.map((tick) => (
          <Label key={`x${tick.value}`} font={fonts.mono} text={tick.text} x={tick.at} y={axisY + 26} align="middle" color={colors.faint} />
        ))}

        <Path path={curvePath} style="stroke" strokeWidth={2.5} strokeJoin="round" strokeCap="round" color={colors.foreground} />

        {layout.strikes.map((strike) => (
          <Group key={`s${strike.x}`}>
            <Circle cx={strike.x} cy={strike.y} r={4.5} color={colors.card} />
            <Circle cx={strike.x} cy={strike.y} r={4.5} style="stroke" strokeWidth={2} color={colors.foreground} />
            <Label font={fonts.sansBold} text={strike.lines[0]} x={strike.x} y={axisY + 48} align="middle" color={colors.mutedForeground} />
            {strike.lines[1] ? (
              <Label font={fonts.mono} text={strike.lines[1]} x={strike.x} y={axisY + 62} align="middle" color={colors.mutedForeground} />
            ) : null}
          </Group>
        ))}

        {layout.breakevens.map((guide) => (
          <Group key={`b${guide.x}`}>
            <Circle cx={guide.x} cy={zeroY} r={4.5} color={colors.card} />
            <Circle cx={guide.x} cy={zeroY} r={4.5} style="stroke" strokeWidth={2} color={colors.foreground} />
            {breakevenLabelVisible(guide, scrub) ? (
              <Label font={fonts.mono} text={guide.text} x={guide.textX} y={zeroY - 10} align={guide.align} color={colors.foreground} halo={colors.card} />
            ) : null}
          </Group>
        ))}

        {[layout.profit, layout.loss].map((limit) =>
          limit ? (
            <Group key={limit.kind}>
              <Label font={fonts.sansBold} text={limit.title} x={limit.x} y={limit.y} align={limit.align} color={colors[limit.kind]} halo={colors.card} />
              <Label font={fonts.monoBold} text={limit.value} x={limit.x} y={limit.y + 14} align={limit.align} color={colors[limit.kind]} halo={colors.card} />
            </Group>
          ) : null,
        )}

        {scrub ? (
          <Group>
            <Line p1={{ x: scrub.x, y: plot.top }} p2={{ x: scrub.x, y: axisY + 12 }} color={colors.foreground} strokeWidth={1.5} />
            <Circle cx={scrub.x} cy={scrub.y} r={9} color={withAlpha(colors.foreground, 0.16)} />
            <Circle cx={scrub.x} cy={scrub.y} r={5} color={colors.primary} />
            <Circle cx={scrub.x} cy={scrub.y} r={5} style="stroke" strokeWidth={2} color={colors.card} />
            <RoundedRect {...scrub.bubble} r={8} color={colors.card} />
            <RoundedRect {...scrub.bubble} r={8} style="stroke" strokeWidth={1} color={colors.border} />
            <Label font={fonts.sans} text={scrub.title} x={scrub.bubble.x + 12} y={scrub.bubble.y + 19} color={colors.mutedForeground} />
            <Label
              font={fonts.monoBold14}
              text={scrub.value}
              x={scrub.bubble.x + 12}
              y={scrub.bubble.y + 38}
              color={scrub.tone === "neutral" ? colors.foreground : colors[scrub.tone]}
            />
            <RoundedRect {...scrub.pill} r={6} color={colors.foreground} />
            <Label font={fonts.monoBold} text={scrub.pillText} x={scrub.x} y={scrub.pill.y + 14} align="middle" color={colors.background} />
          </Group>
        ) : null}
    </Group>
    </Canvas>
  );
}
