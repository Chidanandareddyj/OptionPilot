import { Pressable, View } from "react-native";
import { SlidersHorizontalIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { useTheme } from "@/lib/theme/ThemeProvider";

type FilterButtonProps = { count: number; onPress: () => void };

/** The 52 px square beside the search box. A badge counts the filters that are on. */
export function FilterButton({ count, onPress }: FilterButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `Filters, ${count} on` : "Filters"}
      onPress={onPress}
      className="h-[52px] w-[52px] items-center justify-center rounded-xl border border-border bg-muted"
    >
      <SlidersHorizontalIcon size={20} weight="bold" color={colors.foreground} />
      {count > 0 ? (
        <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1">
          <Text size="xs" weight="semibold" tone="onPrimary">
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
