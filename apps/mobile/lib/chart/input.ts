import { payoffPoints, strikeMarkers, type NormalizedStrategy, type PayoffPoint } from "@optionpilot/shared";
import { chartWindow } from "@/lib/analysis/model";
import type { ChartInput } from "./layout";

export type StrategyChart = {
  points: PayoffPoint[];
  /** The whole price range of the payoff table, which pinching can never leave. */
  bounds: [number, number];
  /** The window the chart opens on. */
  defaultWindow: [number, number];
  input: Omit<ChartInput, "window" | "width" | "height">;
};

/** What the payoff chart needs from one strategy of an analysis. */
export function strategyChart(strategy: NormalizedStrategy, spot: number): StrategyChart {
  const points = payoffPoints(strategy.payoffTable);
  const markers = strikeMarkers(strategy.legs);
  return {
    points,
    bounds: [points[0]?.price ?? 0, points.at(-1)?.price ?? 1],
    defaultWindow: chartWindow(
      points,
      markers.map((marker) => marker.price),
    ),
    input: {
      points,
      strikes: markers,
      breakevens: strategy.breakevens,
      spot: spot > 0 ? spot : undefined,
      maxProfit: strategy.maxProfit,
      maxLoss: strategy.maxLoss,
    },
  };
}
