import { View } from "react-native";
import type { PhosphorIcon } from "@/components/icons";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** Rounded accent tile that leads the verify and forgot-password screens. */
export function IconTile({ icon: IconComponent, size = 64 }: { icon: PhosphorIcon; size?: 64 | 80 }) {
  const { colors } = useTheme();
  const large = size === 80;
  return (
    <View
      className={large ? "h-20 w-20 items-center justify-center rounded-3xl bg-accent" : "h-16 w-16 items-center justify-center rounded-xl bg-accent"}
    >
      <IconComponent size={large ? 40 : 32} weight="bold" color={colors.primary} />
    </View>
  );
}
