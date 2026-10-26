import { Pressable, ScrollView } from "react-native";
import { XIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import type { FilterId } from "@/lib/derivatives/model";
import { useTheme } from "@/lib/theme/ThemeProvider";

type ChipsProps = { chips: { id: FilterId; label: string }[]; onRemove: (id: FilterId) => void };

/** The filters that are on, as chips that each remove their own filter. */
export function ActiveFilterChips({ chips, onRemove }: ChipsProps) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 grow-0" contentContainerClassName="gap-2 px-4">
      {chips.map((chip) => (
        <Pressable
          key={chip.id}
          accessibilityRole="button"
          accessibilityLabel={`${chip.label}, remove`}
          onPress={() => onRemove(chip.id)}
          className="h-9 flex-row items-center gap-2 rounded-full border border-border bg-card px-3"
        >
          <Text size="sm" weight="medium">
            {chip.label}
          </Text>
          <XIcon size={12} weight="bold" color={colors.mutedForeground} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
