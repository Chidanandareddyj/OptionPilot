import { Pressable, ScrollView } from "react-native";
import type { CompareFilter } from "@optionpilot/shared";
import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";

export type FilterChip = { value: CompareFilter; label: string; count: number };

type FilterChipsProps = { chips: FilterChip[]; value: CompareFilter; onChange: (value: CompareFilter) => void };

/** All, Bullish, Bearish, Neutral and Volatile, each with how many strategies it holds. The row scrolls sideways. */
export function FilterChips({ chips, value, onChange }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="-mx-4 grow-0"
      contentContainerClassName="gap-2 px-4"
      accessibilityRole="tablist"
    >
      {chips.map((chip) => {
        const selected = chip.value === value;
        return (
          <Pressable
            key={chip.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${chip.label}, ${chip.count}`}
            onPress={() => onChange(chip.value)}
            className={cn(
              "h-11 flex-row items-center gap-1.5 rounded-full border px-4",
              selected ? "border-transparent bg-primary" : "border-border bg-card",
            )}
          >
            <Text size="sm" weight="medium" tone={selected ? "onPrimary" : "foreground"}>
              {chip.label}
            </Text>
            <Text size="xs" mono tone={selected ? "onPrimary" : "faint"}>
              {chip.count}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
