import { View } from "react-native";
import { ArrowsLeftRightIcon, SparkleIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { useScreenInsets } from "@/lib/safe-area";
import { surfaceColors } from "@/lib/theme/colors";
import { useTheme } from "@/lib/theme/ThemeProvider";

const BAR_TOP_PADDING = 12;
const BUTTON_HEIGHT = 52;

/** Space under the bar's content: the home indicator when there is one, else a plain 16. */
const bottomPadding = (inset: number) => (inset > 0 ? inset - 2 : 16);

/** How much of the screen's bottom the bar covers, plus a gap. Pad scrolling content by this. */
export function useActionBarClearance(): number {
  return BAR_TOP_PADDING + BUTTON_HEIGHT + bottomPadding(useScreenInsets().bottom) + 16;
}

type ActionBarProps = { onCompare: () => void; onRecommend: () => void };

/** The bar pinned under the analysis: Compare and Recommend. */
export function ActionBar({ onCompare, onRecommend }: ActionBarProps) {
  const insets = useScreenInsets();
  const { scheme } = useTheme();
  return (
    <View
      className="absolute inset-x-0 bottom-0 flex-row gap-2 border-t border-border px-4 pt-3"
      style={{
        paddingBottom: bottomPadding(insets.bottom),
        backgroundColor: surfaceColors(scheme).glassBackground,
      }}
    >
      <View className="flex-1">
        <Button label="Compare" variant="ghost" icon={ArrowsLeftRightIcon} onPress={onCompare} />
      </View>
      <View className="flex-1">
        <Button label="Recommend" variant="primary" icon={SparkleIcon} onPress={onRecommend} />
      </View>
    </View>
  );
}
