import { textStyles, tightLetterSpacing } from "@/lib/theme/typography";

describe("textStyles", () => {
  it("turns the shared type scale into pixels", () => {
    expect(textStyles.base).toEqual({ fontSize: 16, lineHeight: 24 });
    expect(textStyles["4xl"]).toEqual({ fontSize: 36, lineHeight: 40 });
  });

  it("gives every step a size and a line height", () => {
    for (const style of Object.values(textStyles)) {
      expect(style.fontSize).toBeGreaterThan(0);
      expect(style.lineHeight).toBeGreaterThanOrEqual(style.fontSize ?? 0);
    }
  });
});

describe("tightLetterSpacing", () => {
  it("is -0.02em in pixels", () => {
    expect(tightLetterSpacing(36)).toBe(-0.72);
  });
});
