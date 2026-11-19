import { useEffect, useRef, useState } from "react";
import { Animated, Platform, TextInput, View } from "react-native";
import { Text } from "@/components/ui";
import { CrossfadeLabel } from "@/components/ui/SelectionPill";
import { TAB_BAR_FADE_MS, TAB_EASE } from "@/lib/motion";
import { withAlpha } from "@/lib/theme/colors";
import { INPUT_RESET } from "@/lib/theme/inputReset";
import { textStyles } from "@/lib/theme/typography";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { useReducedMotion } from "@/lib/useReducedMotion";

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
  const reducedMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [focus] = useState(() => new Animated.Value(0));
  const target = useRef(0);

  useEffect(() => {
    const next = focused ? 1 : 0;
    if (target.current === next) return;
    target.current = next;

    Animated.timing(focus, {
      toValue: next,
      duration: reducedMotion ? 0 : TAB_BAR_FADE_MS,
      easing: TAB_EASE,
      // Border colour cannot run on the native driver, but it changes no layout.
      useNativeDriver: false,
    }).start();
  }, [focus, focused, reducedMotion]);

  const borderColor = focus.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.primary] });
  // The web ring fades in with the border, and an outline never takes layout space.
  const outlineColor = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [withAlpha(colors.primary, 0), colors.primary],
  });

  return (
    <View className="flex-1 gap-2">
      <Text size="sm" weight="medium">
        {label}
      </Text>
      <Animated.View
        className="h-[52px] flex-row items-center gap-2 rounded-xl border bg-muted px-3"
        style={[
          { borderColor },
          Platform.OS === "web"
            ? { outlineWidth: 2, outlineColor, outlineStyle: "solid" }
            : null,
        ]}
      >
        <CrossfadeLabel
          selected={focused}
          reducedMotion={reducedMotion}
          active={
            <Text mono tone="primary">
              ₹
            </Text>
          }
          inactive={
            <Text mono tone="muted">
              ₹
            </Text>
          }
        />
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
      </Animated.View>
    </View>
  );
}
