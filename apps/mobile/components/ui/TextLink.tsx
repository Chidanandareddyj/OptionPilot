import { Pressable } from "react-native";
import { Text, type TextProps } from "./Text";

type TextLinkProps = {
  label: string;
  onPress: () => void;
  size?: TextProps["size"];
  disabled?: boolean;
  accessibilityLabel?: string;
};

/** Inline primary-coloured action, e.g. "Sign up" or "Forgot your password?". */
export function TextLink({ label, onPress, size = "sm", disabled, accessibilityLabel }: TextLinkProps) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      className={disabled ? "opacity-60" : undefined}
    >
      <Text size={size} weight="medium" tone="primary">
        {label}
      </Text>
    </Pressable>
  );
}
