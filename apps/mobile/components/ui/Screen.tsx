import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { cn } from "@/lib/cn";
import { useScreenInsets } from "@/lib/safe-area";

type ScreenProps = {
  children: ReactNode;
  /** Scroll the content. Without it the content fills the screen. */
  scroll?: boolean;
  /** Extra space under the content, e.g. to clear the floating tab bar. */
  bottomSpace?: number;
  /** Pad the top by the status bar and notch. Turn off under a native header. */
  topInset?: boolean;
  /** A screen with text inputs: tapping a button keeps the keyboard handling it, and content clears the keyboard. */
  form?: boolean;
  className?: string;
};

/** Page background, safe-area padding and the 16 px side gutters shared by every screen. */
export function Screen({
  children,
  scroll = false,
  bottomSpace = 0,
  topInset = true,
  form = false,
  className,
}: ScreenProps) {
  const insets = useScreenInsets();
  const paddingTop = topInset ? insets.top : 0;

  if (scroll) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop }}>
        <ScrollView
          className="flex-1"
          contentContainerClassName={cn("px-4", form && "grow", className)}
          contentContainerStyle={{ paddingBottom: bottomSpace }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={form ? "handled" : "never"}
          automaticallyAdjustKeyboardInsets={form}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      className={cn("flex-1 bg-background px-4", className)}
      style={{ paddingTop, paddingBottom: bottomSpace }}
    >
      {children}
    </View>
  );
}
