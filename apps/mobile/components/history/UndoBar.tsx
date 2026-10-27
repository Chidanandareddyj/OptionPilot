import { Pressable, View } from "react-native";
import { WarningCircleIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import type { DeleteNotice } from "@/lib/history/useHistoryDelete";
import { useTheme } from "@/lib/theme/ThemeProvider";

type UndoBarProps = { notice: DeleteNotice; onUndo: () => void; onDismiss: () => void };

/** The bar above the tab bar after a swipe-delete: "RELIANCE deleted. Undo", or why it came back. */
export function UndoBar({ notice, onUndo, onDismiss }: UndoBarProps) {
  const { colors } = useTheme();
  const failed = notice.kind === "failed";
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={`flex-row items-center gap-3 rounded-2xl border bg-card px-4 py-3 ${failed ? "border-loss" : "border-border"}`}
    >
      {failed ? <WarningCircleIcon size={24} weight="fill" color={colors.loss} /> : null}
      <Text size="sm" className="flex-1" numberOfLines={2}>
        {failed ? `Could not delete ${notice.item.company}. It is back in your history.` : `${notice.item.company} deleted.`}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={failed ? "Dismiss" : "Undo"}
        onPress={failed ? onDismiss : onUndo}
        hitSlop={8}
        className="h-[44px] justify-center"
      >
        <Text weight="medium" tone="primary">
          {failed ? "OK" : "Undo"}
        </Text>
      </Pressable>
    </View>
  );
}
