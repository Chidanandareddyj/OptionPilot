import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import { View } from "react-native";
import { CHART_BLEED } from "@/lib/chart/layout";
import type { ChartCanvasProps } from "./PayoffChartCanvas";

export type { ChartCanvasProps };

/** CanvasKit is a WebAssembly download on the web, so the Skia drawing loads after it. */
export function ChartCanvas(props: ChartCanvasProps) {
  return (
    <WithSkiaWeb
      opts={{ locateFile: (file) => `/${file}` }}
      getComponent={async () => ({ default: (await import("./PayoffChartCanvas")).ChartCanvas })}
      fallback={<View style={{ width: props.layout.width + 2 * CHART_BLEED, height: props.layout.height }} />}
      componentProps={props}
    />
  );
}
