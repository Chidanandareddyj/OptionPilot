import { Pressable, TextInput, View } from "react-native";
import { MagnifyingGlassIcon, XCircleIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { useState } from "react";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { INPUT_RESET } from "@/lib/theme/inputReset";
import { textStyles } from "@/lib/theme/typography";

type StrategySearchProps = { value: string; onChangeText: (text: string) => void; placeholder?: string; className?: string; autoCapitalize?: "none" | "characters" };

/** The "Search strategy" box above the list. It filters as you type and has a clear button once it holds text. */
export function StrategySearch({ value, onChangeText, placeholder = "Search strategy", className, autoCapitalize = "none" }: StrategySearchProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      className={cn("h-[52px] flex-row items-center gap-2 rounded-xl border bg-muted px-4", focused ? "border-primary" : "border-border", className)}
      style={focused ? { outlineWidth: 2, outlineColor: colors.primary, outlineStyle: "solid" } : undefined}
    >
      <MagnifyingGlassIcon size={20} weight="bold" color={colors.mutedForeground} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        returnKeyType="search"
        className="min-w-0 flex-1 p-0 font-geist text-foreground"
        style={[textStyles.base, INPUT_RESET]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={12} onPress={() => onChangeText("")}>
          <XCircleIcon size={20} weight="fill" color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}
