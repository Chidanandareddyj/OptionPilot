import { useState, type Ref, type ReactNode } from "react";
import { Pressable, TextInput, View, type TextInputInstance, type TextInputProps } from "react-native";
import { EyeIcon, EyeSlashIcon, WarningCircleIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { INPUT_RESET } from "@/lib/theme/inputReset";
import { textStyles } from "@/lib/theme/typography";

export type TextFieldProps = Omit<TextInputProps, "style" | "placeholderTextColor" | "secureTextEntry"> & {
  label: string;
  /** Message under the field. Also turns the border red. */
  error?: string | null;
  /** Turns the border red without a message, when the message is shown elsewhere. */
  invalid?: boolean;
  /** Shown on the right of the label row, e.g. a "Forgot your password?" link. */
  labelRight?: ReactNode;
  /** Keeps the label for screen readers only, when a card heading already names the field. */
  hideLabel?: boolean;
  /** A password field: hides the text and adds the show/hide eye. */
  password?: boolean;
  inputRef?: Ref<TextInputInstance>;
};

/** A labelled single-line input with the design's focus ring, error border and message. */
export function TextField({
  label,
  error,
  invalid = false,
  labelRight,
  hideLabel = false,
  password = false,
  inputRef,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const hasError = Boolean(error) || invalid;

  return (
    <View className="gap-2">
      {hideLabel ? null : (
        <View className="flex-row items-center justify-between">
          <Text size="sm" weight="medium">
            {label}
          </Text>
          {labelRight}
        </View>
      )}

      <View
        className={cn(
          "h-[52px] flex-row items-center gap-2 rounded-xl border bg-muted px-4",
          hasError ? "border-loss" : "border-border",
        )}
        // The focus ring is a 2 px outline drawn outside the border, as in the design.
        style={
          focused && !hasError
            ? { borderColor: colors.primary, outlineWidth: 2, outlineColor: colors.primary, outlineStyle: "solid" }
            : focused
              ? { outlineWidth: 2, outlineColor: colors.loss, outlineStyle: "solid" }
              : undefined
        }
      >
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          secureTextEntry={password && !revealed}
          placeholderTextColor={colors.faint}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          autoCapitalize="none"
          autoCorrect={false}
          className="min-w-0 flex-1 p-0 font-geist text-foreground"
          style={[textStyles.base, INPUT_RESET]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            hitSlop={12}
            onPress={() => setRevealed((value) => !value)}
          >
            {revealed ? (
              <EyeIcon size={20} color={colors.mutedForeground} />
            ) : (
              <EyeSlashIcon size={20} color={colors.mutedForeground} />
            )}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View className="flex-row items-center gap-1" accessibilityLiveRegion="polite">
          <WarningCircleIcon size={14} weight="fill" color={colors.loss} />
          <Text size="xs" tone="loss">
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
