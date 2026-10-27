import { View } from "react-native";
import { MagnifyingGlassIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { useTheme } from "@/lib/theme/ThemeProvider";

type EmptyMatchesProps = { query: string; total: number };

/** What the list says when the search and filter match nothing. */
export function EmptyMatches({ query, total }: EmptyMatchesProps) {
  const { colors } = useTheme();
  const text = query.trim();
  return (
    <View className="items-center gap-2 px-6 pt-12" accessibilityRole="alert">
      <View className="h-16 w-16 items-center justify-center rounded-xl bg-accent">
        <MagnifyingGlassIcon size={32} color={colors.mutedForeground} />
      </View>
      <Text size="xl" weight="semibold">
        No strategies match
      </Text>
      <Text size="sm" tone="muted" className="mt-1 text-center">
        {text
          ? `Nothing matches “${text}”. Clear the search to see all ${total}.`
          : "Nothing in this view. Pick another filter to see the rest."}
      </Text>
    </View>
  );
}
