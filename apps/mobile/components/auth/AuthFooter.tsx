import { View } from "react-native";
import { Text, TextLink } from "@/components/ui";
import { useScreenInsets } from "@/lib/safe-area";

/** "Don't have an account? Sign up", pinned to the bottom of the screen. */
export function AuthFooter({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  const insets = useScreenInsets();
  return (
    <View
      className="mt-auto flex-row flex-wrap items-center justify-center gap-1 pt-6"
      style={{ paddingBottom: Math.max(insets.bottom + 14, 24) }}
    >
      <Text size="sm" tone="muted">
        {prompt}
      </Text>
      <TextLink label={action} onPress={onPress} />
    </View>
  );
}
