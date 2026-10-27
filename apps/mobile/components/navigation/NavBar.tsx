import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { CaretLeftIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useScreenInsets } from "@/lib/safe-area";
import { surfaceColors } from "@/lib/theme/colors";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** Height of the bar itself, under the status bar. */
export const NAV_BAR_HEIGHT = 44;

type NavBarProps = {
  /** The label beside the back caret, naming the screen it returns to. */
  backLabel: string;
  onBack: () => void;
  /** The centred title, shown only while the bar is solid. */
  title?: string;
  /** Solid once the page has scrolled under it: a near-opaque fill (there is no backdrop blur), a hairline and the title. */
  solid?: boolean;
  /** Controls on the right of the bar, such as a switch. */
  right?: ReactNode;
};

/** The bar over the top of a pushed screen. Content scrolls under it, so pad the page by `useNavBarHeight`. */
export function NavBar({ backLabel, onBack, title, solid = false, right }: NavBarProps) {
  const insets = useScreenInsets();
  const { colors, scheme } = useTheme();
  return (
    <View
      className={cn("absolute inset-x-0 top-0 z-10 border-b", solid ? "border-border" : "border-transparent")}
      style={{ paddingTop: insets.top, backgroundColor: solid ? surfaceColors(scheme).glassBackground : "transparent" }}
    >
      <View className="h-[44px] flex-row items-center justify-between px-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Back to ${backLabel}`}
          onPress={onBack}
          hitSlop={8}
          className="h-[44px] flex-row items-center pl-1 pr-2"
        >
          <CaretLeftIcon size={24} weight="bold" color={colors.primary} />
          <Text weight="medium" tone="primary">
            {backLabel}
          </Text>
        </Pressable>
        {right ? <View className="flex-row items-center gap-2 pr-2">{right}</View> : null}
      </View>
      {solid && title ? (
        <View pointerEvents="none" className="absolute inset-x-24 h-[44px] items-center justify-center" style={{ top: insets.top }}>
          <Text weight="semibold" numberOfLines={1}>
            {title}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Top padding that clears the status bar and a NavBar. */
export function useNavBarHeight(): number {
  return useScreenInsets().top + NAV_BAR_HEIGHT;
}
