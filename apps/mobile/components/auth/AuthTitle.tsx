import { View } from "react-native";
import { Text } from "@/components/ui";

/** Large title with its one line of explanation. `children` lets a value be styled inside it. */
export function AuthTitle({
  title,
  children,
  className = "mt-4",
}: {
  title: string;
  children: React.ReactNode;
  /** Space above the title: 16 px under an icon or logo, 8 px straight under the back row. */
  className?: string;
}) {
  return (
    <View className={className}>
      <Text size="4xl" weight="semibold" tight accessibilityRole="header">
        {title}
      </Text>
      <Text tone="muted" className="mt-2">
        {children}
      </Text>
    </View>
  );
}

/** The user's email inside a sentence: foreground colour and medium weight. */
export function Emphasis({ children }: { children: React.ReactNode }) {
  return <Text weight="semibold">{children}</Text>;
}
