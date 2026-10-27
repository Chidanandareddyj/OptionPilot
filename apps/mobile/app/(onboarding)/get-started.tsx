import { useRouter } from "expo-router";
import { View } from "react-native";
import { useOnboarding } from "@/lib/onboarding";
import { useScreenInsets } from "@/lib/safe-area";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { Brand } from "@/components/brand/Brand";
import {
  ArrowRightIcon,
  ChartLineUpIcon,
  GitBranchIcon,
  ShieldCheckIcon,
  type PhosphorIcon,
} from "@/components/icons";
import { Button, Card, GradientText, PageDots, Screen, Text } from "@/components/ui";

const POINTS: { icon: PhosphorIcon; title: string; body: string }[] = [
  { icon: ShieldCheckIcon, title: "Defined risk", body: "Every structure caps its own downside before you enter it." },
  {
    icon: ChartLineUpIcon,
    title: "12 strategies",
    body: "Pick a view, up, down, sideways or volatile. OptionPilot builds the legs.",
  },
  {
    icon: GitBranchIcon,
    title: "Free and open source",
    body: "The Community Trader plan costs ₹0 and the code is MIT licensed.",
  },
];

export default function OnboardingThree() {
  const insets = useScreenInsets();
  const { colors } = useTheme();
  const router = useRouter();
  const { complete } = useOnboarding();

  /** Marks the intro as seen, which swaps this group for the auth screens, then opens the chosen one. */
  function finish(destination: "/sign-up" | "/sign-in") {
    complete();
    router.replace(destination);
  }

  return (
    <Screen>
      <View className="h-11 flex-row items-center">
        <Brand />
      </View>

      <View className="mt-6 gap-4">
        <GradientText>Start with the worst case</GradientText>
        <Text tone="muted">Free forever, MIT licensed, 12 strategies on NSE, BSE and F&amp;O.</Text>
      </View>

      <Card className="mt-6 p-2">
        {POINTS.map(({ icon: PointIcon, title, body }, index) => (
          <View
            key={title}
            className={`flex-row items-center gap-4 px-2 py-4 ${index > 0 ? "border-t border-border" : ""}`}
          >
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-accent">
              <PointIcon size={24} weight="bold" color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text weight="semibold">{title}</Text>
              <Text size="sm" tone="muted">
                {body}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      <View className="mt-auto gap-3" style={{ paddingBottom: Math.max(insets.bottom + 14, 24) }}>
        <PageDots count={3} active={2} />
        <View className="h-3" />
        <Button label="Create free account" variant="primary" icon={ArrowRightIcon} onPress={() => finish("/sign-up")} />
        <Button label="I already have an account" variant="ghost" onPress={() => finish("/sign-in")} />
        <Text size="xs" tone="faint" className="text-center">
          By continuing you agree to the Terms and Privacy policy.
        </Text>
      </View>
    </Screen>
  );
}
