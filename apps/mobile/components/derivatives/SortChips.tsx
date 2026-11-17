import { Pressable, ScrollView } from "react-native";
import type { BoardView } from "@optionpilot/shared";
import { CaretDownIcon, CaretUpIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import { SORT_OPTIONS } from "@/lib/derivatives/model";
import { useTheme } from "@/lib/theme/ThemeProvider";

type SortChipsProps = {
  sort: BoardView["sort"];
  dir: BoardView["dir"];
  onSort: (key: BoardView["sort"]) => void;
  className?: string;
};

/** The board's sort order as chips: the chosen field fills in and shows its direction; choosing it again flips. */
export function SortChips({ sort, dir, onSort, className }: SortChipsProps) {
  const { colors } = useTheme();
  const Caret = dir === "asc" ? CaretUpIcon : CaretDownIcon;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className={className} contentContainerClassName="items-center gap-2">
      {SORT_OPTIONS.map((option) => {
        const selected = option.value === sort;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`Sort by ${option.label}`}
            onPress={() => onSort(option.value)}
            className={cn("h-10 flex-row items-center gap-1.5 rounded-full border px-3.5", selected ? "border-primary bg-primary" : "border-border bg-card")}
          >
            <Text size="sm" weight={selected ? "semibold" : "medium"} tone={selected ? "onPrimary" : "muted"} numberOfLines={1}>
              {option.label}
            </Text>
            {selected ? <Caret size={12} weight="bold" color={colors.primaryForeground} /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
