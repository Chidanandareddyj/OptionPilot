import { Pressable, View } from "react-native";
import { cn } from "@/lib/cn";
import { Text } from "./Text";

export type Segment<T extends string> = { value: T; label: string; count?: number };

type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/** The 52 px switcher between views of one screen. The selected segment is raised, not coloured. */
export function SegmentedControl<T extends string>({ segments, value, onChange, className }: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      className={cn("h-[52px] flex-row gap-1 rounded-xl border border-border bg-muted p-1", className)}
    >
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={segment.count === undefined ? segment.label : `${segment.label}, ${segment.count}`}
            onPress={() => onChange(segment.value)}
            className={cn("flex-1 flex-row items-center justify-center gap-1 rounded-lg", selected && "bg-accent")}
          >
            <Text size="sm" weight={selected ? "semibold" : "medium"} tone={selected ? "foreground" : "muted"} numberOfLines={1}>
              {segment.label}
            </Text>
            {segment.count === undefined ? null : (
              <Text size="xs" mono tone={selected ? "muted" : "faint"}>
                {segment.count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
