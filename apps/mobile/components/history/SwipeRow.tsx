import { useState, type ReactNode } from "react";
import { Animated, PanResponder, Pressable, View } from "react-native";
import { TrashIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** How far the row slides to show its action. */
export const SWIPE_ACTION_WIDTH = 96;
const OPEN_AT = SWIPE_ACTION_WIDTH / 2;

type SwipeRowProps = {
  children: ReactNode;
  onPress: () => void;
  onAction: () => void;
  /** "Delete". Used for the button behind the row and for the screen reader action. */
  actionLabel: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
};

/**
 * A row that slides left to show a red action, as in iOS lists. Built on PanResponder so it
 * needs no native module and works the same on the web preview. Screen readers get the action
 * as a custom action on the row rather than a gesture.
 */
/** The sliding state of one row: where it is, and the gesture that moves it. Made once per row. */
function createSwipe() {
  const x = new Animated.Value(0);
  let open = false;
  let start = 0;
  let panned = false;
  // A drag that ends on the row can still be reported as a press (on the web, as a click). Those must not open the snapshot.
  const endPan = () => setTimeout(() => (panned = false), 120);
  const settle = (toOpen: boolean) => {
    open = toOpen;
    Animated.spring(x, { toValue: toOpen ? -SWIPE_ACTION_WIDTH : 0, useNativeDriver: false, bounciness: 0, speed: 24 }).start();
  };
  const responder = PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_event, gesture) => Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
    onPanResponderGrant: () => {
      start = open ? -SWIPE_ACTION_WIDTH : 0;
      panned = true;
    },
    onPanResponderMove: (_event, gesture) => {
      x.setValue(Math.max(-SWIPE_ACTION_WIDTH - 24, Math.min(0, start + gesture.dx)));
    },
    onPanResponderRelease: (_event, gesture) => {
      settle(start + gesture.dx < -OPEN_AT || gesture.vx < -0.6);
      endPan();
    },
    onPanResponderTerminate: () => {
      settle(open);
      endPan();
    },
  });
  return { x, settle, isOpen: () => open, wasPanned: () => panned, panHandlers: responder.panHandlers };
}

export function SwipeRow({ children, onPress, onAction, actionLabel, accessibilityLabel, accessibilityHint }: SwipeRowProps) {
  const { colors } = useTheme();
  const [swipe] = useState(createSwipe);

  return (
    <View className="overflow-hidden rounded-2xl">
      <View className="absolute inset-y-0 right-0 bg-loss" style={{ width: SWIPE_ACTION_WIDTH + 24 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={() => {
            swipe.settle(false);
            onAction();
          }}
          className="h-full items-center justify-center gap-1"
          style={{ width: SWIPE_ACTION_WIDTH }}
        >
          <TrashIcon size={22} weight="bold" color={colors.background} />
          <Text size="xs" weight="medium" className="text-background">
            {actionLabel}
          </Text>
        </Pressable>
      </View>
      <Animated.View style={{ transform: [{ translateX: swipe.x }] }} {...swipe.panHandlers}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityActions={[{ name: "delete", label: actionLabel }]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "delete") onAction();
          }}
          onPress={() => {
            if (swipe.wasPanned()) return;
            if (swipe.isOpen()) swipe.settle(false);
            else onPress();
          }}
        >
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
}
