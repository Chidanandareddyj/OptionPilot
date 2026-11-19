import { Animated, Pressable, View, type LayoutRectangle } from "react-native";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { CrossfadeLabel, SelectionPill, usePressScale, useSelectionPill } from "./SelectionPill";
import { Text } from "./Text";

export type Segment<T extends string> = { value: T; label: string; count?: number };

type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** `primary` fills the selected segment with the accent colour, as the derivatives switchers do. */
  tone?: "raised" | "primary";
};

type SegmentButtonProps<T extends string> = {
  segment: Segment<T>;
  selected: boolean;
  tone: "raised" | "primary";
  /** Keeps the plain selected fill until the sliding pill has a measured position. */
  fallback: boolean;
  reducedMotion: boolean;
  onLayout: (layout: LayoutRectangle) => void;
  onPress: () => void;
};

function SegmentButton<T extends string>({
  segment,
  selected,
  tone,
  fallback,
  reducedMotion,
  onLayout,
  onPress,
}: SegmentButtonProps<T>) {
  const press = usePressScale(reducedMotion);
  const activeTone = tone === "primary" ? "onPrimary" : "foreground";
  const inactiveTone = "muted";
  const label = segment.count === undefined ? segment.label : `${segment.label}, ${segment.count}`;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onLayout={(event) => onLayout(event.nativeEvent.layout)}
      className={cn(
        "flex-1 items-center justify-center rounded-lg",
        selected && fallback && (tone === "primary" ? "bg-primary" : "bg-accent"),
      )}
    >
      <Animated.View style={{ transform: [{ scale: press.scale }] }}>
        <CrossfadeLabel
          selected={selected}
          reducedMotion={reducedMotion}
          active={
            <View className="flex-row items-center justify-center gap-1">
              <Text size="sm" weight="semibold" tone={activeTone} numberOfLines={1}>
                {segment.label}
              </Text>
              {segment.count === undefined ? null : (
                <Text size="xs" mono tone="muted">
                  {segment.count}
                </Text>
              )}
            </View>
          }
          inactive={
            <View className="flex-row items-center justify-center gap-1">
              <Text size="sm" weight="medium" tone={inactiveTone} numberOfLines={1}>
                {segment.label}
              </Text>
              {segment.count === undefined ? null : (
                <Text size="xs" mono tone="faint">
                  {segment.count}
                </Text>
              )}
            </View>
          }
        />
      </Animated.View>
    </Pressable>
  );
}

/** The 52 px switcher between views of one screen. The selected segment is raised, not coloured. */
export function SegmentedControl<T extends string>({ segments, value, onChange, className, tone = "raised" }: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const { layout, translateX, measure, reducedMotion } = useSelectionPill(value);

  return (
    <View
      accessibilityRole="tablist"
      className={cn("h-[52px] flex-row gap-1 rounded-xl border border-border bg-muted p-1", className)}
    >
      <SelectionPill layout={layout} translateX={translateX} color={tone === "primary" ? colors.primary : colors.accent} radius={8} />
      {segments.map((segment) => (
        <SegmentButton
          key={segment.value}
          segment={segment}
          selected={segment.value === value}
          tone={tone}
          fallback={!layout}
          reducedMotion={reducedMotion}
          onLayout={(next) => measure(segment.value, next)}
          onPress={() => onChange(segment.value)}
        />
      ))}
    </View>
  );
}
