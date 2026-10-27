import { Pressable, ScrollView } from "react-native";
import { XIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";
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
          className={cn("h-11 flex-row items-center gap-2 rounded-full border px-4", chip.id === "investment" ? "border-primary bg-primary" : "border-border bg-card")}
        >
          <Text size="sm" weight="medium" tone={chip.id === "investment" ? "onPrimary" : "foreground"}>
            {chip.label}
          </Text>
          <XIcon size={14} weight="bold" color={chip.id === "investment" ? colors.primaryForeground : colors.mutedForeground} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
