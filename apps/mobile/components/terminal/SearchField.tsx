import { Pressable, View } from "react-native";
import { MagnifyingGlassIcon, XCircleIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { useTheme } from "@/lib/theme/ThemeProvider";

type SearchFieldProps = {
  value: string;
  onPress: () => void;
  onClear: () => void;
};

/**
 * The search box on the Terminal. It looks like an input, but typing happens in the search sheet,
 * which it opens, so the sheet can list matches over the keyboard.
 */
export function SearchField({ value, onPress, onClear }: SearchFieldProps) {
  const { colors } = useTheme();
  return (
    <View className="h-[52px] flex-1 flex-row items-center gap-2 rounded-xl border border-border bg-muted px-4">
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search F&O symbol"
        accessibilityValue={{ text: value }}
        onPress={onPress}
        className="h-full flex-1 flex-row items-center gap-2"
      >
        <MagnifyingGlassIcon size={20} weight="bold" color={colors.mutedForeground} />
        <Text className="flex-1" tone={value ? "foreground" : "faint"} numberOfLines={1}>
          {value || "Search F&O symbol"}
        </Text>
      </Pressable>
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear symbol" hitSlop={12} onPress={onClear}>
          <XCircleIcon size={20} weight="fill" color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}
