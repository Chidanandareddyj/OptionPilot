import { strategiesOf } from "@/lib/analysis/model";
import { sparkline } from "@/lib/chart/spark";
import { analysisResult } from "./fixtures/analysis";

const strategies = strategiesOf(analysisResult());
const byKey = (key: string) => strategies.find((item) => item.key === key)!;

describe("sparkline", () => {
  it("draws one path that stays inside its box", () => {
    const spark = sparkline(byKey("bull_call_spread"), 72, 40)!;
    expect(spark.d.startsWith("M")).toBe(true);
    const coords = [...spark.d.matchAll(/[ML]([\d.]+),([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(coords.length).toBeGreaterThan(2);
    coords.forEach(([x, y]) => {
      expect(x).toBeGreaterThanOrEqual(2);
      expect(x).toBeLessThanOrEqual(70);
      expect(y).toBeGreaterThanOrEqual(2);
      expect(y).toBeLessThanOrEqual(38);
    });
  });

  it("rises left to right for a bull spread: a lower price is lower on the page", () => {
    const spark = sparkline(byKey("bull_call_spread"), 72, 40)!;
    const ys = [...spark.d.matchAll(/[ML][\d.]+,([\d.]+)/g)].map((m) => Number(m[1]));
    expect(ys[0]!).toBeGreaterThan(ys[ys.length - 1]!);
  });

  it("puts the zero line between the loss and the profit of a spread", () => {
    const spark = sparkline(byKey("bull_call_spread"), 72, 40)!;
    expect(spark.zeroY).toBeGreaterThan(2);
    expect(spark.zeroY).toBeLessThan(38);
  });

  it("gives nothing for a strategy with no payoff table", () => {
    expect(sparkline({ ...byKey("bull_call_spread"), payoffTable: [] }, 72, 40)).toBeNull();
  });
});
