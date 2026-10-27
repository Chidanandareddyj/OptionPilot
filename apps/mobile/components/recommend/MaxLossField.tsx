import { useState, type Ref } from "react";
import { TextInput, View, type TextInputInstance } from "react-native";
import { Text } from "@/components/ui";
import { cleanAmount, groupAmount } from "@/lib/analysis/recommend";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { INPUT_RESET } from "@/lib/theme/inputReset";
import { textStyles } from "@/lib/theme/typography";

type MaxLossFieldProps = {
  /** The digits as typed, without commas. */
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  invalid?: boolean;
  disabled?: boolean;
  inputRef?: Ref<TextInputInstance>;
};

/** The most the user accepts losing on one lot, in rupees. Typed on the number pad, shown with Indian grouping. */
export function MaxLossField({ value, onChangeText, onSubmit, invalid = false, disabled = false, inputRef }: MaxLossFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-2">
      <Text size="sm" weight="medium">
        Max loss per trade
      </Text>
      <View
        className={cn("h-[52px] flex-row items-center gap-2 rounded-xl border bg-muted px-4", invalid ? "border-loss" : focused ? "border-primary" : "border-border")}
        style={focused ? { outlineWidth: 2, outlineColor: invalid ? colors.loss : colors.primary, outlineStyle: "solid" } : undefined}
      >
        <Text mono tone="muted">
          ₹
        </Text>
        <TextInput
          ref={inputRef}
          accessibilityLabel="Max loss per trade"
          accessibilityHint="The most you accept losing on one lot, in rupees"
          value={groupAmount(value)}
          onChangeText={(text) => onChangeText(cleanAmount(text))}
          editable={!disabled}
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          placeholder="20,000"
          placeholderTextColor={colors.faint}
          className="min-w-0 flex-1 p-0 font-geist-mono text-foreground"
          style={[textStyles.base, INPUT_RESET]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      <Text size="xs" tone="muted">
        The most you accept losing on one lot. Strategies above it are marked not viable.
      </Text>
    </View>
  );
}
