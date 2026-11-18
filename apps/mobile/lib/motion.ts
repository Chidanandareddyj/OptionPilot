import { Easing } from "react-native";

/** How long a dock tab takes to slide across the screen. */
export const TAB_TRANSITION_MS = 300;

/** How long the active pill takes to travel between dock items. */
export const TAB_BAR_SLIDE_MS = 280;

/** How long the dock's icon and label take to crossfade. */
export const TAB_BAR_FADE_MS = 160;

/** How long a dock item takes to press in; the release uses the same curve. */
export const TAB_PRESS_MS = 110;

/** Balanced deceleration with a soft settle. No overshoot. */
export const TAB_EASE = Easing.bezier(0.32, 0.72, 0, 1);
