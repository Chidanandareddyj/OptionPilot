import type { AnalysisSummary } from "@optionpilot/shared";
import {
  flattenHistory,
  formatHistoryTime,
  historySubtitle,
  historyTag,
  insertAnalysis,
  removeFromPages,
  restoreToPages,
  withoutAnalysis,
} from "@/lib/history/model";

const item = (id: string, createdAt: string): AnalysisSummary => ({ id, company: id.toUpperCase(), spot: 100, tag: "12 strategies", createdAt });
const A = item("a", "2026-10-25T10:00:00.000Z");
const B = item("b", "2026-10-24T10:00:00.000Z");
const C = item("c", "2026-10-23T10:00:00.000Z");
const D = item("d", "2026-10-22T10:00:00.000Z");
const data = (...pages: AnalysisSummary[][]) => ({
  pages: pages.map((analyses, index) => ({ analyses, nextCursor: index < pages.length - 1 ? `cursor-${index}` : null })),
  pageParams: pages.map((_page, index) => (index === 0 ? null : `cursor-${index - 1}`)),
});
const ids = (list: AnalysisSummary[]) => list.map((entry) => entry.id);

describe("history tag", () => {
  it("shows a chosen strategy with its view", () => {
    expect(historyTag("Neutral · Put Butterfly")).toEqual({ label: "Neutral · Put Butterfly", icon: "neutral" });
    expect(historyTag("Bullish · Bull Call Spread")).toEqual({ label: "Bullish · Bull Call Spread", icon: "bullish" });
  });
  it("shows a comparison and a plain run as they are", () => {
    expect(historyTag("Compare view")).toEqual({ label: "Compare view", icon: "compare" });
    expect(historyTag("12 strategies")).toEqual({ label: "12 strategies", icon: "strategies" });
  });
});

describe("history time", () => {
  it("is in IST, with a two-digit hour and am/pm", () => {
    expect(formatHistoryTime("2026-10-23T16:57:00.000Z")).toBe("23 Oct, 10:27 pm IST");
    expect(formatHistoryTime("2026-10-15T11:18:00.000Z")).toBe("15 Oct, 04:48 pm IST");
    expect(formatHistoryTime("2026-10-16T05:23:00.000Z")).toBe("16 Oct, 10:53 am IST");
  });
  it("rolls into the next day in IST", () => {
    expect(formatHistoryTime("2026-10-31T19:00:00.000Z")).toBe("1 Nov, 12:30 am IST");
  });
  it("is empty for a date it cannot read", () => expect(formatHistoryTime("nope")).toBe(""));
});

describe("history subtitle", () => {
  it("counts the snapshots, with a plus while more pages wait", () => {
    expect(historySubtitle("ready", 20, false)).toBe("20 saved snapshots. Open one to reload that analysis.");
    expect(historySubtitle("ready", 20, true)).toBe("20+ saved snapshots. Open one to reload that analysis.");
    expect(historySubtitle("ready", 1, false)).toBe("1 saved snapshot. Open one to reload that analysis.");
    expect(historySubtitle("ready", 0, false)).toBe("0 saved snapshots.");
  });
  it("says when it is loading or failed", () => {
    expect(historySubtitle("loading", 0, false)).toBe("Loading saved analyses.");
    expect(historySubtitle("error", 0, false)).toBe("Could not load your saved analyses.");
  });
});

describe("history pages", () => {
  it("flattens the pages in order", () => {
    expect(ids(flattenHistory(data([A, B], [C])))).toEqual(["a", "b", "c"]);
    expect(flattenHistory(undefined)).toEqual([]);
  });
  it("takes a row out of whichever page holds it and keeps the cursors", () => {
    const next = removeFromPages(data([A, B], [C, D]), "c");
    expect(next.pages.map((page) => ids(page.analyses))).toEqual([["a", "b"], ["d"]]);
    expect(next.pages.map((page) => page.nextCursor)).toEqual(["cursor-0", null]);
  });
  it("puts a row back where it was", () => {
    const hidden = removeFromPages(data([A, B], [C, D]), "b");
    expect(restoreToPages(hidden, B).pages.map((page) => ids(page.analyses))).toEqual([["a", "b"], ["c", "d"]]);
    const top = removeFromPages(data([A, B]), "a");
    expect(ids(restoreToPages(top, A).pages[0]!.analyses)).toEqual(["a", "b"]);
  });
  it("puts a row older than everything loaded at the end of the last page", () => {
    expect(restoreToPages(data([A], [B]), D).pages.map((page) => ids(page.analyses))).toEqual([["a"], ["b", "d"]]);
  });
  it("does not duplicate a row that is already there", () => {
    const loaded = data([A, B]);
    expect(restoreToPages(loaded, B)).toBe(loaded);
    expect(insertAnalysis([A, B], B)).toEqual([A, B]);
  });
  it("keeps a newest-first list in order on insert and remove", () => {
    expect(ids(insertAnalysis([A, C], B))).toEqual(["a", "b", "c"]);
    expect(ids(withoutAnalysis([A, B, C], "b"))).toEqual(["a", "c"]);
  });
});
