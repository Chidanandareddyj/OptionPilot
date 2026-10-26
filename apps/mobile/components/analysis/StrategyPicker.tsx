import { Modal, Pressable, ScrollView, View } from "react-native";
import type { NormalizedStrategy } from "@optionpilot/shared";
import { CheckIcon, XIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { VIEW_LABEL } from "@/lib/analysis/model";
import { useScreenInsets } from "@/lib/safe-area";
import { surfaceColors } from "@/lib/theme/colors";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { ViewTag } from "./ViewTag";

type StrategyPickerProps = {
  visible: boolean;
  strategies: NormalizedStrategy[];
  selectedKey: string;
  onSelect: (key: string) => void;
  onClose: () => void;
};

/** A bottom sheet listing every strategy the calculators produced for this symbol. */
export function StrategyPicker({ visible, strategies, selectedKey, onSelect, onClose }: StrategyPickerProps) {
  const insets = useScreenInsets();
  const { colors, scheme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close strategy list"
          onPress={onClose}
          className="absolute inset-0"
          style={{ backgroundColor: surfaceColors(scheme).scrim }}
        />
        <View
          className="max-h-[80%] rounded-t-3xl bg-card px-4 pt-6"
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <View className="mb-2 flex-row items-center">
            <Text size="2xl" weight="semibold" tight accessibilityRole="header" className="flex-1">
              Choose a strategy
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full border border-border bg-card"
            >
              <XIcon size={16} weight="bold" color={colors.foreground} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {strategies.map((strategy) => {
              const selected = strategy.key === selectedKey;
              return (
                <Pressable
                  key={strategy.key}
                  accessibilityRole="button"
                  accessibilityLabel={`${strategy.name}, ${VIEW_LABEL[strategy.category]}`}
                  accessibilityState={{ selected }}
                  onPress={() => onSelect(strategy.key)}
                  className="min-h-14 flex-row items-center gap-3 border-t border-border py-3"
                >
                  <Text weight={selected ? "semibold" : "regular"} className="flex-1" numberOfLines={1}>
                    {strategy.name}
                  </Text>
                  <ViewTag view={strategy.category} />
                  <View className="w-5 items-center">
                    {selected ? <CheckIcon size={20} weight="bold" color={colors.primary} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
