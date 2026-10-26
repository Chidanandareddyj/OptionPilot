import { View } from "react-native";
import { ClockIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { useTheme } from "@/lib/theme/ThemeProvider";

type InfoBannerProps = { title: string; message: string; footnote?: string };

/** The neutral card above the list: a clock, a title, a message and an optional footnote with a grey dot. */
export function InfoBanner({ title, message, footnote }: InfoBannerProps) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="summary" className="gap-3 rounded-2xl border border-border bg-card px-4 py-4">
      <View className="flex-row gap-3">
        <ClockIcon size={24} weight="bold" color={colors.mutedForeground} />
        <View className="flex-1">
          <Text weight="semibold">{title}</Text>
          <Text size="sm" tone="muted">
            {message}
          </Text>
        </View>
      </View>
      {footnote ? (
        <View className="ml-9 flex-row items-center gap-2">
          <View className="h-2 w-2 rounded-full bg-faint" />
          <Text size="xs" tone="muted">
            {footnote}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
