import { Pressable, TextInput, View, type TextInputInstance } from "react-native";
import type { Ref } from "react";
import { MagnifyingGlassIcon, XCircleIcon } from "@/components/icons";
import { INPUT_RESET } from "@/lib/theme/inputReset";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { textStyles } from "@/lib/theme/typography";

type SearchInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  inputRef?: Ref<TextInputInstance>;
};

/** The focused symbol field at the top of the search sheet: a primary ring, a clear button and the Analyze return key. */
export function SearchInput({ value, onChangeText, onSubmit, inputRef }: SearchInputProps) {
  const { colors } = useTheme();
  return (
    <View
      className="h-[52px] flex-1 flex-row items-center gap-2 rounded-xl border bg-muted px-4"
      style={{ borderColor: colors.primary, outlineWidth: 2, outlineColor: colors.primary, outlineStyle: "solid" }}
    >
      <MagnifyingGlassIcon size={20} weight="bold" color={colors.mutedForeground} />
      <TextInput
        ref={inputRef}
        accessibilityLabel="Search F&O symbol"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="Search F&O symbol"
        placeholderTextColor={colors.faint}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        autoFocus
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="go"
        enablesReturnKeyAutomatically
        className="min-w-0 flex-1 p-0 font-geist text-foreground"
        style={[textStyles.base, INPUT_RESET]}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear symbol" hitSlop={12} onPress={() => onChangeText("")}>
          <XCircleIcon size={20} weight="fill" color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}
