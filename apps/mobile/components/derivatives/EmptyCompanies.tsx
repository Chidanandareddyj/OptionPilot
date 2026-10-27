import { View } from "react-native";
import { MagnifyingGlassIcon } from "@/components/icons";
import { Button, Text } from "@/components/ui";
import { useTheme } from "@/lib/theme/ThemeProvider";

type EmptyCompaniesProps = { search: string; onClear: () => void };

/** What the board says when the search and filters match no company. */
export function EmptyCompanies({ search, onClear }: EmptyCompaniesProps) {
  const { colors } = useTheme();
  const text = search.trim();
  return (
    <View className="items-center gap-2 px-6 pt-10" accessibilityRole="alert">
      <View className="h-16 w-16 items-center justify-center rounded-xl bg-accent">
        <MagnifyingGlassIcon size={32} color={colors.mutedForeground} />
      </View>
      <Text size="xl" weight="semibold" className="mt-1">
        No matching companies.
      </Text>
      <Text size="sm" tone="muted" className="mt-1 text-center">
        {text ? `Nothing matches “${text}” with these filters.` : "Nothing matches these filters."}
        {"\n"}
        Clear the search or reset the filters.
      </Text>
      <Button label="Clear filters" variant="ghost" onPress={onClear} className="mt-4 self-center" />
    </View>
  );
}
