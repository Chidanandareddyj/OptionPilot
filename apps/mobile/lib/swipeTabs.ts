/** The tab routes in dock order, left to right. Same order as the screens in `(tabs)/_layout`. */
export const SWIPE_TAB_ROUTES = ["terminal", "derivatives", "history", "settings"] as const;

export type SwipeTabRoute = (typeof SWIPE_TAB_ROUTES)[number];

/** A drag must travel this far horizontally before the tab gesture claims it from the view below. */
export const SWIPE_CLAIM_DISTANCE = 36;

/** A drag this long changes tabs even when it ends slowly. */
export const SWIPE_COMMIT_DISTANCE = 48;

/** A shorter drag changes tabs only when it is also a fling this fast (points per millisecond). */
export const SWIPE_FLING_DISTANCE = 24;

/** Points per millisecond. 0.35 is about 350 points per second. */
export const SWIPE_FLING_VELOCITY = 0.35;

/** The horizontal travel must beat the vertical travel by this ratio. */
export const SWIPE_SLOPE_RATIO = 1.5;

export type SwipeInput = {
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  /** The index of the tab that is showing. */
  index: number;
  /** The number of tabs. */
  count: number;
};

/** The tab to open after a swipe, or null to stay where the finger lifts. */
export type SwipeDecision = { targetIndex: number } | null;

/** Whether the drag is more horizontal than vertical, so a list can still scroll and a chart can pan. */
export function isHorizontalDrag(dx: number, dy: number): boolean {
  return Math.abs(dx) > Math.abs(dy) * SWIPE_SLOPE_RATIO;
}

/**
 * Whether the swipe wrapper should take a move from the screen. It never takes a touch start: a
 * small move is still a tap, a vertical move is still a scroll, and a child horizontal scroller
 * gets to claim its own drag first.
 */
export function shouldClaimSwipe(dx: number, dy: number): boolean {
  return Number.isFinite(dx) && Number.isFinite(dy) && Math.abs(dx) >= SWIPE_CLAIM_DISTANCE && isHorizontalDrag(dx, dy);
}

/**
 * The tab a released swipe should open. Swiping left (dx < 0) goes to the next tab and swiping
 * right goes to the previous one. There is no wrap-around: a swipe past the first or last tab
 * stays put.
 */
export function swipeTarget({ dx, dy, vx, index, count }: SwipeInput): SwipeDecision {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || !Number.isFinite(vx)) return null;
  if (!Number.isInteger(index) || !Number.isInteger(count) || count <= 0 || index < 0 || index >= count) return null;
  if (!isHorizontalDrag(dx, dy)) return null;

  const distance = Math.abs(dx);
  const committed =
    distance >= SWIPE_COMMIT_DISTANCE ||
    (distance >= SWIPE_FLING_DISTANCE && Math.abs(vx) >= SWIPE_FLING_VELOCITY);
  if (!committed) return null;

  const targetIndex = index + (dx < 0 ? 1 : -1);
  if (targetIndex < 0 || targetIndex >= count) return null;
  return { targetIndex };
}

/**
 * The index of the tab a pathname belongs to, or -1 when the pathname is outside the tabs. Group
 * segments such as `(app)` are not part of a pathname, but they are skipped in case one is passed.
 */
export function tabIndexFromPathname(pathname: string): number {
  const first = pathname
    .split("/")
    .find((part) => part.length > 0 && !(part.startsWith("(") && part.endsWith(")")));
  if (!first) return -1;
  return SWIPE_TAB_ROUTES.indexOf(first as SwipeTabRoute);
}
