import { payoffPoints, strikeMarkers } from "@optionpilot/shared";
import { chartWindow, strategiesOf } from "@/lib/analysis/model";
import {
  breakevenLabelVisible,
  layoutChart,
  layoutScrub,
  strikeLines,
  windowCurve,
  zoomWindow,
  BUBBLE,
  type ChartInput,
  type ScrubReadout,
} from "@/lib/chart/layout";
import { analysisResult, SPOT } from "./fixtures/analysis";

const strategies = strategiesOf(analysisResult());
const build = (key: string, overrides: Partial<ChartInput> = {}): ChartInput => {
  const s = strategies.find((item) => item.key === key)!;
  const points = payoffPoints(s.payoffTable);
  const markers = strikeMarkers(s.legs);
  return {
    points,
    window: chartWindow(points, markers.map((m) => m.price)),
    strikes: markers,
    breakevens: s.breakevens,
    spot: SPOT,
    maxProfit: s.maxProfit,
    maxLoss: s.maxLoss,
    width: 340,
    height: 252,
    ...overrides,
  };
};

describe("windowCurve", () => {
  const points = [
    { price: 0, pnl: -10 },
    { price: 10, pnl: -10 },
    { price: 20, pnl: 10 },
    { price: 30, pnl: 10 },
  ];

  it("cuts to the window, interpolating the edges and the zero crossing", () => {
    expect(windowCurve(points, [5, 25])).toEqual([
      { price: 5, pnl: -10 },
      { price: 10, pnl: -10 },
      { price: 15, pnl: 0 },
      { price: 20, pnl: 10 },
      { price: 25, pnl: 10 },
    ]);
  });

  it("is empty without points", () => {
    expect(windowCurve([], [0, 1])).toEqual([]);
  });
});

describe("strikeLines", () => {
  it("splits the action from the strike", () => {
    expect(strikeLines("Buy 1,180 CE")).toEqual(["Buy", "1,180 CE"]);
    expect(strikeLines("Sell 2× 1,200 CE")).toEqual(["Sell 2×", "1,200 CE"]);
    expect(strikeLines("Buy 1,190 CE + PE")).toEqual(["Buy", "1,190 CE + PE"]);
    expect(strikeLines("1,200 Sell CE, Buy PE")).toEqual(["1,200 Sell CE, Buy PE"]);
  });
});

describe("layoutChart for the bull call spread", () => {
  const layout = layoutChart(build("bull_call_spread"));

  it("keeps the plot inside the card and the window on the x axis", () => {
    expect(layout.plot).toEqual({ left: 44, top: 36, right: 320, bottom: 180 });
    expect(layout.window).toEqual([1150, 1230]);
    expect(layout.xOf(1150)).toBe(44);
    expect(layout.xOf(1230)).toBe(320);
    expect(layout.priceAt(182)).toBeCloseTo(1190);
    expect(layout.priceAt(-100)).toBe(1150);
    expect(layout.priceAt(900)).toBe(1230);
  });

  it("puts zero between the extremes and the loss above the line, like the design", () => {
    expect(layout.yOf(layout.yTicks.at(-1)!.value)).toBeCloseTo(layout.plot.top);
    expect(layout.yOf(layout.yTicks[0].value)).toBeCloseTo(layout.plot.bottom);
    expect(layout.zeroY).toBeGreaterThan(layout.plot.top);
    expect(layout.zeroY).toBeLessThan(layout.plot.bottom);
    expect(layout.yTicks.find((t) => t.value === 0)!.text).toBe("0");
  });

  it("labels the axis with round values", () => {
    expect(layout.xTicks.map((t) => t.text)).toEqual(["1,160", "1,180", "1,200", "1,220"]);
    expect(layout.ruler.length).toBeGreaterThan(70);
    expect(layout.ruler.filter((r) => r.major).map((r) => r.price)).toEqual([1150, 1160, 1170, 1180, 1190, 1200, 1210, 1220, 1230]);
  });

  it("marks both strikes, the spot and the breakeven", () => {
    expect(layout.strikes.map((s) => s.lines)).toEqual([["Buy", "1,180 CE"], ["Sell", "1,200 CE"]]);
    expect(layout.spot?.label).toBe("Spot 1,190.00");
    expect(layout.breakevens.map((b) => b.text)).toEqual(["Breakeven 1,188.60"]);
  });

  it("spells the limits in words with signs", () => {
    expect(layout.profit).toMatchObject({ title: "Max profit", value: "+5,700", align: "end" });
    expect(layout.loss).toMatchObject({ title: "Max loss", value: "\u22124,300", align: "start" });
  });
});

describe("layoutChart edge cases", () => {
  it("says Unlimited for open profit and leaves out a spot outside the window", () => {
    const layout = layoutChart(build("long_straddle", { spot: 5 }));
    expect(layout.profit?.value).toBe("Unlimited");
    expect(layout.spot).toBeNull();
  });

  it("omits limit labels that are not applicable", () => {
    const layout = layoutChart(build("bull_call_spread", { maxProfit: null, maxLoss: null }));
    expect(layout.profit).toBeNull();
    expect(layout.loss).toBeNull();
  });
});

describe("layoutScrub", () => {
  const input = build("bull_call_spread");
  const layout = layoutChart(input);

  it("reads the integer price under the finger with its P&L", () => {
    const readout = layoutScrub(layout, input.points, layout.xOf(1197.3));
    expect(readout.price).toBe(1197);
    expect(readout.title).toBe("At 1,197 expiry");
    expect(readout.pnl).toBeCloseTo(4200, 0);
    expect(readout.value).toBe("+4,200 P&L");
    expect(readout.tone).toBe("profit");
    expect(readout.pillText).toBe("1,197");
  });

  it("is a loss below the breakeven and flat zero at it", () => {
    const loss = layoutScrub(layout, input.points, layout.xOf(1160));
    expect(loss).toMatchObject({ tone: "loss", value: "\u22124,300 P&L" });
  });

  it("keeps the bubble inside the plot, and off the labels where there is room", () => {
    for (const price of [1152, 1170, 1189, 1197, 1210, 1228]) {
      const { bubble } = layoutScrub(layout, input.points, layout.xOf(price));
      expect(bubble.width).toBe(BUBBLE.width);
      expect(bubble.x).toBeGreaterThanOrEqual(layout.plot.left);
      expect(bubble.x + bubble.width).toBeLessThanOrEqual(layout.plot.right + 8);
      expect(bubble.y).toBeGreaterThanOrEqual(layout.plot.top);
      expect(bubble.y + bubble.height).toBeLessThanOrEqual(layout.plot.bottom);
      if (price === 1170 || price === 1210) continue; // no label-free spot: the bubble may cover one label
      for (const area of layout.avoid) {
        const apart =
          bubble.x + bubble.width <= area.x ||
          bubble.x >= area.x + area.width ||
          bubble.y + bubble.height <= area.y ||
          bubble.y >= area.y + area.height;
        expect(apart).toBe(true);
      }
    }
  });

  it("clamps a finger outside the plot to the window edge", () => {
    expect(layoutScrub(layout, input.points, -50).price).toBe(1150);
    expect(layoutScrub(layout, input.points, 9999).price).toBe(1230);
  });
});

describe("zoomWindow", () => {
  const bounds = [1090, 1290] as const;

  it("zooms about the focal point and keeps that price still", () => {
    const [low, high] = zoomWindow([1150, 1230], bounds, 2, 0.25);
    expect(high - low).toBe(40);
    expect(low + (high - low) * 0.25).toBe(1150 + 80 * 0.25);
  });

  it("never leaves the bounds or goes wider than the full range", () => {
    expect(zoomWindow([1150, 1230], bounds, 0.01, 0.5)).toEqual([1090, 1290]);
    const [low, high] = zoomWindow([1100, 1180], bounds, 2, 0);
    expect(low).toBe(1100);
    expect(high).toBe(1140);
    expect(zoomWindow([1250, 1290], bounds, 0.5, 1)[1]).toBe(1290);
  });

  it("stops zooming in at a tenth of the range", () => {
    const [low, high] = zoomWindow([1150, 1230], bounds, 100, 0.5);
    expect(high - low).toBe(20);
  });

  it("ignores a scale that is not a positive number", () => {
    expect(zoomWindow([1150, 1230], bounds, 0)).toEqual([1150, 1230]);
    expect(zoomWindow([1150, 1230], bounds, Number.NaN)).toEqual([1150, 1230]);
  });
});

describe("breakevenLabelVisible", () => {
  const layout = layoutChart(build("bull_call_spread"));
  const guide = layout.breakevens[0];

  it("shows the label when nothing is being scrubbed", () => {
    expect(breakevenLabelVisible(guide, null)).toBe(true);
  });

  it("hides the label while the bubble covers it", () => {
    const covering = { bubble: guide.rect } as ScrubReadout;
    const away = { bubble: { x: 0, y: 0, width: 4, height: 4 } } as ScrubReadout;
    expect(breakevenLabelVisible(guide, covering)).toBe(false);
    expect(breakevenLabelVisible(guide, away)).toBe(true);
  });
});
