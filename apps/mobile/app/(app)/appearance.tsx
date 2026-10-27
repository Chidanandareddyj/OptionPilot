import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { AppearancePicker } from "@/components/appearance/AppearancePicker";
import { XIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { useScreenInsets } from "@/lib/safe-area";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** Presented as a form sheet over Settings (see the options in (app)/_layout.tsx). */
export default function AppearanceSheet() {
  const router = useRouter();
  const insets = useScreenInsets();
  const { colors } = useTheme();
  return (
    <View className="bg-card px-4 pt-6" style={{ paddingBottom: Math.max(insets.bottom, 24) + 8 }}>
      <View className="mb-4 flex-row items-center">
        <Text size="2xl" weight="semibold" tight accessibilityRole="header" className="flex-1">
          Appearance
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={8}
          className="h-8 w-8 items-center justify-center rounded-full border border-border bg-card"
        >
          <XIcon size={16} weight="bold" color={colors.foreground} />
        </Pressable>
      </View>
      <AppearancePicker />
      <Text size="xs" tone="muted" className="mt-3">
        Dark and Light match the website. System follows your phone.
      </Text>
    </View>
  );
}
