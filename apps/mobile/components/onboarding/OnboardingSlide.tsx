import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useScreenInsets } from "@/lib/safe-area";
import { Brand } from "@/components/brand/Brand";
import { Button, Card, GradientText, Inset, PageDots, Screen, Text } from "@/components/ui";

type OnboardingSlideProps = {
  step: 0 | 1;
  eyebrow: string;
  art: ReactNode;
  title: string;
  body: string;
  onContinue: () => void;
  onSkip: () => void;
};

/** The first two intro slides: an illustrated card, a headline, and a Continue button. */
export function OnboardingSlide({ step, eyebrow, art, title, body, onContinue, onSkip }: OnboardingSlideProps) {
  const insets = useScreenInsets();
  return (
    <Screen>
      <View className="h-11 flex-row items-center justify-between">
        <Brand />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip introduction"
          onPress={onSkip}
          hitSlop={8}
          className="h-11 justify-center px-2"
        >
          <Text weight="medium" tone="muted">
            Skip
          </Text>
        </Pressable>
      </View>

      <Card className="mt-4 p-4">
        <Text size="xs" tone="muted" className="mb-2">
          {eyebrow}
        </Text>
        <Inset className="p-2">{art}</Inset>
      </Card>

      <View className="mt-6 gap-4">
        <GradientText>{title}</GradientText>
        <Text tone="muted" className="max-w-[340px]">
          {body}
        </Text>
      </View>

      <View className="mt-auto gap-6" style={{ paddingBottom: Math.max(insets.bottom + 14, 24) }}>
        <PageDots count={3} active={step} />
        <Button label="Continue" variant="primary" onPress={onContinue} />
      </View>
    </Screen>
  );
}
