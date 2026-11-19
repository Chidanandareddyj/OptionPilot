import { type ReactNode, useMemo } from "react";
import { PanResponder, StyleSheet, TextInput, View, useWindowDimensions } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { TAB_BAR_CLEARANCE } from "@/components/navigation/FloatingTabBar";
import { SWIPE_TAB_ROUTES, shouldClaimSwipe, swipeTarget, tabIndexFromPathname } from "@/lib/swipeTabs";

type SwipeTabsProps = { children: ReactNode };

/**
 * Adds horizontal swipe to the tab screens: left opens the next dock tab and right the previous
 * one. The gesture never moves the scene itself. On release it only changes the route, so the tab
 * navigator's own 300 ms slide plays exactly as it does after a dock tap.
 *
 * `Tabs` from `expo-router/js-tabs` accepts a ref, but `withLayoutContext` hands it to the standard
 * navigator, which drops it while partitioning props, and the published ref type is `unknown`.
 * There is no navigator handle to call `navigate(routeName)` on, so this uses `useRouter()` with
 * the route's path instead. That dispatches the same `NAVIGATE` action the dock emits, which
 * changes the tab index in place (not a stack push), so the existing slide still animates.
 */
export function SwipeTabs({ children }: SwipeTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { height } = useWindowDimensions();
  const index = Math.max(0, tabIndexFromPathname(pathname));

  // The responder is recreated only when the route or the window changes, both of which end or
  // cancel a gesture anyway. Everyday re-renders (theme, data) keep the same responder.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // The non-capture variant: children get the first refusal. SwipeRow's capture handler, a
        // horizontal ScrollView's native pan, the chart's gestures and text selection all win
        // before this runs.
        onMoveShouldSetPanResponder: (_event, gesture) => {
          // A focused field may be selecting text; never take that drag. react-native-web's
          // TextInput.State only has the older `currentlyFocusedField`, hence the fallback.
          const focusedInput = TextInput.State.currentlyFocusedInput?.() ?? TextInput.State.currentlyFocusedField?.();
          if (focusedInput) return false;
          // The dock is not screen content: a drag that starts over it belongs to its Pressables.
          if (gesture.y0 >= height - TAB_BAR_CLEARANCE) return false;
          return shouldClaimSwipe(gesture.dx, gesture.dy);
        },
        onPanResponderRelease: (_event, gesture) => {
          const next = swipeTarget({
            dx: gesture.dx,
            dy: gesture.dy,
            vx: gesture.vx,
            vy: gesture.vy,
            index,
            count: SWIPE_TAB_ROUTES.length,
          });
          if (next) router.navigate(`/${SWIPE_TAB_ROUTES[next.targetIndex]}`);
        },
      }),
    [height, index, router],
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
