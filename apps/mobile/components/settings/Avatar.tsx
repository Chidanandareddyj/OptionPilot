import { Image, View } from "react-native";
import { Text } from "@/components/ui";
import { initials } from "@/lib/account/model";

type AvatarProps = {
  name: string;
  email: string;
  image?: string | null;
  /** Side of the square in px. */
  size?: number;
};

/** The account tile: the chosen picture, else the initials on the brand colour. */
export function Avatar({ name, email, image, size = 64 }: AvatarProps) {
  const radius = size >= 56 ? 12 : 10;
  if (image) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="Your avatar"
        source={{ uri: image }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="items-center justify-center bg-primary"
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <Text size={size >= 56 ? "2xl" : "base"} weight="semibold" tone="onPrimary">
        {initials(name, email)}
      </Text>
    </View>
  );
}
