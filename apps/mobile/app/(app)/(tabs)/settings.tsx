import { useRouter } from "expo-router";
import { View } from "react-native";
import { MoonStarsIcon } from "@/components/icons";
import { TAB_BAR_CLEARANCE } from "@/components/navigation/FloatingTabBar";
import { Card, ListGroup, ListRow, Screen, Text } from "@/components/ui";
import { APPEARANCE_LABELS } from "@/components/appearance/options";
import { useTheme } from "@/lib/theme/ThemeProvider";

export default function SettingsTab() {
  const router = useRouter();
  const { appearance } = useTheme();
  return (
    <Screen scroll bottomSpace={TAB_BAR_CLEARANCE}>
      <View className="pt-[44px]">
        <Text size="sm" tone="muted">
          Account
        </Text>
        <Text size="4xl" weight="semibold" tight accessibilityRole="header">
          Settings
        </Text>
      </View>

      <View className="mt-6">
        <ListGroup>
          <ListRow
            first
            icon={MoonStarsIcon}
            label="Appearance"
            value={APPEARANCE_LABELS[appearance]}
            onPress={() => router.push("/appearance")}
          />
        </ListGroup>
      </View>

      <Card className="mt-4 gap-2 p-4">
        <Text size="xs" weight="medium" tone="primary">
          PLACEHOLDER · PHASE 11
        </Text>
        <Text tone="muted">Profile, security, organizations and sign out arrive in phase 11.</Text>
      </Card>
    </Screen>
  );
}
