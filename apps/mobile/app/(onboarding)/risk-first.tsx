import { useRouter } from "expo-router";
import { OnboardingSlide } from "@/components/onboarding/OnboardingSlide";
import { WorstCaseCard } from "@/components/onboarding/WorstCaseCard";

export default function OnboardingTwo() {
  const router = useRouter();
  return (
    <OnboardingSlide
      step={1}
      eyebrow="Bull call spread on RELIANCE, sample data"
      art={<WorstCaseCard />}
      title="See the worst case first, then decide"
      body="Every strategy is drawn, stress tested and scored before you risk a rupee. You see maximum loss in rupees for one lot."
      onContinue={() => router.push("/get-started")}
      onSkip={() => router.push("/get-started")}
    />
  );
}
