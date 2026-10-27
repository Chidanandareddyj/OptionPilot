import { Pressable, View } from "react-native";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { CheckIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { APPEARANCE_OPTIONS, type AppearanceOption } from "./options";

function Swatch({ swatch }: { swatch: AppearanceOption["swatch"] }) {
  return (
    <View className="h-11 w-11 flex-row items-center justify-center overflow-hidden rounded-xl border border-border">
      {swatch.split ? (
        <>
          <View className="h-full flex-1" style={{ backgroundColor: swatch.background }} />
          <View className="h-full flex-1" style={{ backgroundColor: swatch.split }} />
        </>
      ) : (
        <View className="h-full w-full items-center justify-center" style={{ backgroundColor: swatch.background }}>
          <View className="h-4 w-4 rounded-full" style={{ backgroundColor: swatch.dot }} />
        </View>
      )}
    </View>
  );
}

/** Dark, Light and System choices. Picking one applies it straight away and is remembered. */
export function AppearancePicker() {
  const { appearance, setAppearance, colors } = useTheme();
  return (
    <View className="gap-1" accessibilityRole="radiogroup">
      {APPEARANCE_OPTIONS.map((option) => {
        const selected = option.value === appearance;
        return (
          <Pressable
            key={option.value}
            role="radio"
            accessibilityLabel={`${option.title}. ${option.description}`}
            accessibilityState={{ selected, checked: selected }}
            onPress={() => setAppearance(option.value)}
            className={`min-h-16 flex-row items-center gap-3 rounded-2xl px-4 py-2 ${selected ? "bg-accent" : ""}`}
          >
            <Swatch swatch={option.swatch} />
            <View className="flex-1">
              <Text weight="semibold">{option.title}</Text>
              <Text size="xs" tone="muted">
                {option.description}
              </Text>
            </View>
            <View
              className={`h-6 w-6 items-center justify-center rounded-full ${selected ? "bg-primary" : "border border-border"}`}
            >
              {selected ? <CheckIcon size={16} weight="bold" color={colors.primaryForeground} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
