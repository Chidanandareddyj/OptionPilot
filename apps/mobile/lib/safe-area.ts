import { useSafeAreaInsets, type EdgeInsets } from "react-native-safe-area-context";

/**
 * Build-time override used only to render screens on the web with a phone's notch and home bar
 * (`EXPO_PUBLIC_PREVIEW_INSETS=54,34`), because a desktop browser reports no safe area.
 * Unset in every real build.
 */
function previewInsets(): EdgeInsets | null {
  const raw = process.env.EXPO_PUBLIC_PREVIEW_INSETS;
  if (!raw) return null;
  const [top, bottom] = raw.split(",").map(Number);
  return { top: top ?? 0, bottom: bottom ?? 0, left: 0, right: 0 };
}

const PREVIEW = previewInsets();

/** Review-only: a fixed pull distance (`EXPO_PUBLIC_PREVIEW_PULL=60`) so the pull-to-refresh hint can be shown on the web, which cannot bounce. */
export const PREVIEW_PULL = Number(process.env.EXPO_PUBLIC_PREVIEW_PULL ?? 0) || 0;

export function useScreenInsets(): EdgeInsets {
  const insets = useSafeAreaInsets();
  return PREVIEW ?? insets;
}
