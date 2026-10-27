import { useCallback, useMemo, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { GestureDetector, usePanGesture, usePinchGesture, useSimultaneousGestures } from "react-native-gesture-handler";
import { Inset } from "@/components/ui";
import { strategyChart } from "@/lib/chart/input";
import { CHART_BLEED, layoutChart, layoutScrub, zoomWindow } from "@/lib/chart/layout";
import type { NormalizedStrategy } from "@optionpilot/shared";
import { ChartCanvas } from "./ChartCanvas";

export const CHART_HEIGHT = 252;

type PayoffChartProps = {
  strategy: NormalizedStrategy;
  spot: number;
  /** Tells the card whether a finger is reading the chart, so it can change its hint. */
  onScrubChange?: (scrubbing: boolean) => void;
};

type Pinch = { scale: number; focal: number };

/**
 * The payoff chart with its two touch gestures: drag a finger across it to read the P&L at any
 * price, pinch to zoom the price range. Both run on the JS thread (`runOnJS`) because the readout
 * only changes once per whole price, so there is nothing to gain from a worklet.
 */
export function PayoffChart({ strategy, spot, onScrubChange }: PayoffChartProps) {
  /** The measured width, which is the canvas width: the plot box sits inside it, CHART_BLEED in. */
  const [measured, setMeasured] = useState(0);
  const width = Math.max(0, measured - 2 * CHART_BLEED);
  const [scrubX, setScrubX] = useState<number | null>(null);
  const [baseWindow, setBaseWindow] = useState<readonly [number, number] | null>(null);
  const [pinch, setPinch] = useState<Pinch | null>(null);

  const chart = useMemo(() => strategyChart(strategy, spot), [strategy, spot]);
  const committed = baseWindow ?? chart.defaultWindow;
  const window = pinch ? zoomWindow(committed, chart.bounds, pinch.scale, pinch.focal) : committed;

  const layout = useMemo(
    () => (width > 0 ? layoutChart({ ...chart.input, window, width, height: CHART_HEIGHT }) : null),
    // `window` is a new array every render, so key on its numbers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chart, width, window[0], window[1]],
  );
  const scrub = layout && scrubX !== null ? layoutScrub(layout, chart.points, scrubX) : null;

  const setScrubbing = useCallback(
    (x: number | null) => {
      setScrubX(x);
      onScrubChange?.(x !== null);
    },
    [onScrubChange],
  );

  const pan = usePanGesture({
    runOnJS: true,
    activeOffsetX: [-6, 6],
    failOffsetY: [-14, 14],
    onActivate: (event) => setScrubbing(event.x - CHART_BLEED),
    onUpdate: (event) => setScrubbing(event.x - CHART_BLEED),
    onFinalize: () => setScrubbing(null),
  });
  const pinchGesture = usePinchGesture({
    runOnJS: true,
    onUpdate: (event) => setPinch({ scale: event.scale, focal: width > 0 ? Math.min(Math.max((event.focalX - CHART_BLEED) / width, 0), 1) : 0.5 }),
    onFinalize: () => {
      setPinch((current) => {
        if (current) setBaseWindow(zoomWindow(committed, chart.bounds, current.scale, current.focal));
        return null;
      });
    },
  });
  const gesture = useSimultaneousGestures(pan, pinchGesture);

  const onLayout = (event: LayoutChangeEvent) => setMeasured(Math.round(event.nativeEvent.layout.width));

  return (
    <GestureDetector gesture={gesture}>
      <View>
        <Inset pointerEvents="none" className="absolute inset-x-2 inset-y-0" />
        <View
          onLayout={onLayout}
          style={{ height: CHART_HEIGHT, marginTop: 8, marginBottom: 4 }}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Payoff chart for ${strategy.name}. Drag to read the profit or loss at any price.`}
        >
          {layout ? <ChartCanvas layout={layout} scrub={scrub} /> : null}
        </View>
      </View>
    </GestureDetector>
  );
}
