import { Pressable, View } from "react-native";
import { CaretLeftIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** The 44 px "‹ Back" row at the top of the auth screens. */
export function BackLink({ label = "Back", onPress }: { label?: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <View className="-mx-2 h-11 flex-row items-center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        hitSlop={8}
        className="h-11 flex-row items-center pl-1 pr-2"
      >
        <CaretLeftIcon size={24} weight="bold" color={colors.primary} />
        <Text weight="medium" tone="primary">
          {label}
        </Text>
      </Pressable>
    </View>
  );
}
