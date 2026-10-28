import { useEffect, useRef, type ComponentRef } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/ui";
import { strategySegments } from "@/lib/derivatives/model";

/** All twelve strategies in one row. Names are too long to share the width, so the row scrolls and keeps the selected chip in view. */
export function StrategySwitcher({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const offsets = useRef<Record<string, number>>({});

  useEffect(() => {
    const x = offsets.current[value];
    if (x != null) scroller.current?.scrollTo({ x: Math.max(0, x - 4), animated: false });
  }, [value]);

  return (
    <View className="h-[52px] overflow-hidden rounded-xl border border-border bg-muted">
      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="h-[52px] items-center gap-1 p-1"
      >
        {strategySegments().map((segment) => {
          const selected = segment.value === value;
          return (
            <Pressable
              key={segment.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={segment.label}
              onPress={() => onChange(segment.value)}
              onLayout={(event) => {
                offsets.current[segment.value] = event.nativeEvent.layout.x;
                if (segment.value === value) scroller.current?.scrollTo({ x: Math.max(0, event.nativeEvent.layout.x - 4), animated: false });
              }}
              className={`h-11 items-center justify-center rounded-lg px-3 ${selected ? "bg-primary" : ""}`}
            >
              <Text size="sm" weight={selected ? "semibold" : "medium"} tone={selected ? "onPrimary" : "muted"} numberOfLines={1}>
                {segment.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
