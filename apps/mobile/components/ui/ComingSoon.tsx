import { View } from "react-native";
import { TAB_BAR_CLEARANCE } from "@/components/navigation/FloatingTabBar";
import { Card, Screen, Text } from "@/components/ui";

type ComingSoonProps = { title: string; eyebrow: string; phase: number; description: string };

/** Marks a tab whose real screen is built in a later phase of the mobile plan. */
export function ComingSoon({ title, eyebrow, phase, description }: ComingSoonProps) {
  return (
    <Screen scroll bottomSpace={TAB_BAR_CLEARANCE}>
      <View className="pt-[44px]">
        <Text size="sm" tone="muted">
          {eyebrow}
        </Text>
        <Text size="4xl" weight="semibold" tight accessibilityRole="header">
          {title}
        </Text>
      </View>
      <Card className="mt-4 gap-2 p-4">
        <Text size="xs" weight="medium" tone="primary">
          PLACEHOLDER · PHASE {phase}
        </Text>
        <Text tone="muted">{description}</Text>
      </Card>
    </Screen>
  );
}
