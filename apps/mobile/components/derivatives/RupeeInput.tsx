import { useState } from "react";
import { TextInput, View } from "react-native";
import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import { INPUT_RESET } from "@/lib/theme/inputReset";
import { textStyles } from "@/lib/theme/typography";
import { useTheme } from "@/lib/theme/ThemeProvider";

type RupeeInputProps = {
  label: string;
  placeholder: string;
  /** Whole rupees, or null for none. */
  value: number | null;
  onChange: (value: number | null) => void;
};

/** A rupee amount typed on the number pad and shown with Indian grouping. Empty means no limit. */
export function RupeeInput({ label, placeholder, value, onChange }: RupeeInputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View className="flex-1 gap-2">
      <Text size="sm" weight="medium">
        {label}
      </Text>
      <View
        className={cn("h-[52px] flex-row items-center gap-2 rounded-xl border bg-muted px-3", focused ? "border-primary" : "border-border")}
        style={focused ? { outlineWidth: 2, outlineColor: colors.primary, outlineStyle: "solid" } : undefined}
      >
        <Text mono tone="muted">
          ₹
        </Text>
        <TextInput
          accessibilityLabel={`${label} investment`}
          value={value == null ? "" : value.toLocaleString("en-IN")}
          onChangeText={(text) => {
            const digits = text.replace(/\D/g, "");
            onChange(digits === "" ? null : Number(digits));
          }}
          keyboardType="number-pad"
          returnKeyType="done"
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          className="min-w-0 flex-1 p-0 font-geist-mono text-foreground"
          style={[textStyles.base, INPUT_RESET]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}
