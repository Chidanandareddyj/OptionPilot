import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { NavBar, useNavBarHeight } from "@/components/navigation/NavBar";
import { Text } from "@/components/ui";

type SettingsPageProps = {
  title: string;
  children: ReactNode;
  /** The page has text inputs: the keyboard avoids them and taps reach buttons first time. */
  form?: boolean;
  /** Pinned under the scrolling content, e.g. a primary button. */
  footer?: ReactNode;
};

/** A pushed Settings screen: back bar, "Settings" kicker, large title, and scrolling content under the bar. */
export function SettingsPage({ title, children, form = false, footer }: SettingsPageProps) {
  const router = useRouter();
  const navHeight = useNavBarHeight();
  const [solid, setSolid] = useState(false);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = event.nativeEvent.contentOffset.y > 8;
    if (next !== solid) setSolid(next);
  };

  return (
    <View className="flex-1 bg-background">
      <NavBar
        backLabel="Settings"
        title={title}
        solid={solid}
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/settings"))}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingTop: navHeight + 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={form ? "handled" : "never"}
        automaticallyAdjustKeyboardInsets={form}
        scrollEventThrottle={16}
        onScroll={onScroll}
      >
        <View className="mb-6">
          <Text size="sm" tone="muted">
            Settings
          </Text>
          <Text size="4xl" weight="semibold" tight accessibilityRole="header">
            {title}
          </Text>
        </View>
        <View className="gap-4">{children}</View>
      </ScrollView>
      {footer}
    </View>
  );
}
