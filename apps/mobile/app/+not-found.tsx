import { useRouter } from "expo-router";
import { View } from "react-native";
import { FlatPayoff } from "@/components/art/FlatPayoff";
import { ArrowLeftIcon, ChartLineUpIcon } from "@/components/icons";
import { Button, Card, GradientText, Inset, Screen, Text } from "@/components/ui";
import { useOnboarding } from "@/lib/onboarding";
import { useScreenInsets } from "@/lib/safe-area";

export default function NotFound() {
  const router = useRouter();
  const insets = useScreenInsets();
  const { seen } = useOnboarding();

  const openTerminal = () => router.replace(seen ? "/terminal" : "/");
  const goBack = () => (router.canGoBack() ? router.back() : openTerminal());

  return (
    <Screen>
      <View className="gap-2 pt-[42px]">
        <Text size="sm" tone="muted">
          Error 404
        </Text>
        <GradientText size="6xl">404</GradientText>
        <Text size="2xl" weight="semibold" tight className="mt-2">
          This page is out of the money.
        </Text>
        <Text tone="muted">The address does not match any page. It may have moved, or the link may be mistyped.</Text>
      </View>

      <Card className="mt-6 p-4">
        <Inset className="p-2">
          <FlatPayoff />
        </Inset>
      </Card>

      <View className="mt-auto gap-2" style={{ paddingBottom: Math.max(insets.bottom + 14, 24) }}>
        <Button label="Open the terminal" variant="primary" icon={ChartLineUpIcon} onPress={openTerminal} />
        <Button label="Go back" variant="ghost" icon={ArrowLeftIcon} onPress={goBack} />
      </View>
    </Screen>
  );
}
