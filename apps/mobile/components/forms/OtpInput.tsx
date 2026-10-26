import { useRef, useState } from "react";
import { Pressable, TextInput, View, type TextInputInstance } from "react-native";
import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { OTP_LENGTH } from "@/lib/auth/validation";

type OtpInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  invalid?: boolean;
  autoFocus?: boolean;
};

/** Six digit cells over one hidden input, so paste and the keyboard's one-time-code suggestion work. */
export function OtpInput({ value, onChangeText, length = OTP_LENGTH, invalid = false, autoFocus = false }: OtpInputProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, length - 1);

  return (
    <Pressable
      accessibilityLabel={`${length} digit verification code`}
      onPress={() => inputRef.current?.focus()}
      className="flex-row gap-2"
    >
      {Array.from({ length }, (_, index) => {
        const isActive = focused && index === active;
        return (
          <View
            key={index}
            className={cn(
              "h-14 flex-1 items-center justify-center rounded-xl border bg-muted",
              invalid ? "border-loss" : isActive ? "border-primary" : "border-border",
            )}
            style={isActive ? { outlineWidth: 2, outlineColor: invalid ? colors.loss : colors.primary, outlineStyle: "solid" } : undefined}
          >
            <Text mono weight="medium" size="2xl">
              {value[index] ?? ""}
            </Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(next) => onChangeText(next.replace(/\D/g, "").slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        accessibilityLabel="Verification code"
        // Covers the cells and takes no part in layout, so taps and paste land on it.
        className="absolute inset-0 opacity-0"
      />
    </Pressable>
  );
}
