import { View } from "react-native";
import { WarningCircleIcon, type PhosphorIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { useTheme } from "@/lib/theme/ThemeProvider";

type FormAlertProps = {
  title: string;
  message: string;
  /** Defaults to the warning circle. */
  icon?: PhosphorIcon;
};

/** The error card above a form: red border and icon, a title and one explanatory line. */
export function FormAlert({ title, message, icon: IconComponent = WarningCircleIcon }: FormAlertProps) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      className="flex-row gap-3 rounded-2xl border border-loss bg-card px-4 py-3"
    >
      <IconComponent size={24} weight={IconComponent === WarningCircleIcon ? "fill" : "bold"} color={colors.loss} />
      <View className="flex-1">
        <Text weight="semibold">{title}</Text>
        <Text size="sm" tone="muted">
          {message}
        </Text>
      </View>
    </View>
  );
}
