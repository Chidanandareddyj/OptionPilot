import {
  SWIPE_CLAIM_DISTANCE,
  SWIPE_COMMIT_DISTANCE,
  SWIPE_FLING_DISTANCE,
  SWIPE_FLING_VELOCITY,
  SWIPE_SLOPE_RATIO,
  shouldClaimSwipe,
  swipeTarget,
  tabIndexFromPathname,
  type SwipeInput,
} from "@/lib/swipeTabs";

const input = (overrides: Partial<SwipeInput> = {}): SwipeInput => ({
  dx: 0,
  dy: 0,
  vx: 0,
  vy: 0,
  index: 1,
  count: 4,
  ...overrides,
});

describe("shouldClaimSwipe", () => {
  it("waits for a deliberate horizontal drag", () => {
    expect(shouldClaimSwipe(SWIPE_CLAIM_DISTANCE - 1, 0)).toBe(false);
    expect(shouldClaimSwipe(-(SWIPE_CLAIM_DISTANCE - 1), 0)).toBe(false);
    expect(shouldClaimSwipe(SWIPE_CLAIM_DISTANCE, 0)).toBe(true);
    expect(shouldClaimSwipe(-SWIPE_CLAIM_DISTANCE, 0)).toBe(true);
  });

  it("leaves vertical scrolling and diagonal drags alone", () => {
    expect(shouldClaimSwipe(40, 40)).toBe(false);
    // Exactly on the ratio is not enough: the horizontal travel must beat it.
    expect(shouldClaimSwipe(SWIPE_CLAIM_DISTANCE, SWIPE_CLAIM_DISTANCE / SWIPE_SLOPE_RATIO)).toBe(false);
    expect(shouldClaimSwipe(SWIPE_CLAIM_DISTANCE + 1, SWIPE_CLAIM_DISTANCE / SWIPE_SLOPE_RATIO)).toBe(true);
  });

  it("never claims on an unreadable gesture", () => {
    expect(shouldClaimSwipe(Number.NaN, 0)).toBe(false);
    expect(shouldClaimSwipe(0, Number.NaN)).toBe(false);
  });
});

describe("swipeTarget", () => {
  it("swipes left to the next tab and right to the previous one", () => {
    expect(swipeTarget(input({ dx: -SWIPE_COMMIT_DISTANCE }))).toEqual({ targetIndex: 2 });
    expect(swipeTarget(input({ dx: SWIPE_COMMIT_DISTANCE }))).toEqual({ targetIndex: 0 });
  });

  it("switches on a long drag even when it ends slowly or reverses at the end", () => {
    expect(swipeTarget(input({ dx: -SWIPE_COMMIT_DISTANCE, vx: 0 }))).toEqual({ targetIndex: 2 });
    // The net travel decides the direction; a late flick back does not undo it.
    expect(swipeTarget(input({ dx: -60, vx: 1 }))).toEqual({ targetIndex: 2 });
  });

  it("switches on a short, fast fling", () => {
    expect(swipeTarget(input({ dx: -SWIPE_FLING_DISTANCE, vx: -SWIPE_FLING_VELOCITY }))).toEqual({ targetIndex: 2 });
    expect(swipeTarget(input({ dx: SWIPE_FLING_DISTANCE, vx: SWIPE_FLING_VELOCITY }))).toEqual({ targetIndex: 0 });
  });

  it("does not switch on a short slow drag", () => {
    expect(swipeTarget(input({ dx: -(SWIPE_COMMIT_DISTANCE - 1), vx: -(SWIPE_FLING_VELOCITY - 0.01) }))).toEqual(null);
    expect(swipeTarget(input({ dx: -(SWIPE_FLING_DISTANCE - 1), vx: -2 }))).toEqual(null);
  });

  it("does not switch on a drag that is not clearly horizontal", () => {
    expect(swipeTarget(input({ dx: -SWIPE_COMMIT_DISTANCE, dy: -(SWIPE_COMMIT_DISTANCE / SWIPE_SLOPE_RATIO), vx: -1 }))).toEqual(null);
    expect(swipeTarget(input({ dx: -SWIPE_COMMIT_DISTANCE, dy: -1, vx: -1 }))).toEqual({ targetIndex: 2 });
  });

  it("stops at the first and last tab instead of wrapping", () => {
    expect(swipeTarget(input({ index: 0, dx: SWIPE_COMMIT_DISTANCE }))).toEqual(null);
    expect(swipeTarget(input({ index: 0, dx: -SWIPE_COMMIT_DISTANCE }))).toEqual({ targetIndex: 1 });
    expect(swipeTarget(input({ index: 3, dx: -SWIPE_COMMIT_DISTANCE }))).toEqual(null);
    expect(swipeTarget(input({ index: 3, dx: SWIPE_COMMIT_DISTANCE }))).toEqual({ targetIndex: 2 });
  });

  it("ignores impossible states and unreadable gestures", () => {
    expect(swipeTarget(input({ count: 0, index: 0, dx: -60 }))).toEqual(null);
    expect(swipeTarget(input({ index: -1, dx: -60 }))).toEqual(null);
    expect(swipeTarget(input({ index: 4, dx: -60 }))).toEqual(null);
    expect(swipeTarget(input({ index: 1.5, dx: -60 }))).toEqual(null);
    expect(swipeTarget(input({ dx: Number.NaN, vx: -1 }))).toEqual(null);
    expect(swipeTarget(input({ dx: -60, vx: Number.NaN }))).toEqual(null);
  });
});

describe("tabIndexFromPathname", () => {
  it("maps each tab path to its dock position", () => {
    expect(tabIndexFromPathname("/terminal")).toBe(0);
    expect(tabIndexFromPathname("/derivatives")).toBe(1);
    expect(tabIndexFromPathname("/history")).toBe(2);
    expect(tabIndexFromPathname("/settings")).toBe(3);
  });

  it("uses the first real segment and skips route groups", () => {
    expect(tabIndexFromPathname("/(app)/(tabs)/history")).toBe(2);
    expect(tabIndexFromPathname("/settings/account")).toBe(3);
    expect(tabIndexFromPathname("/derivatives/filters")).toBe(1);
  });

  it("reports paths outside the tabs", () => {
    expect(tabIndexFromPathname("/")).toBe(-1);
    expect(tabIndexFromPathname("/analysis/abc")).toBe(-1);
    expect(tabIndexFromPathname("")).toBe(-1);
  });
});
