import { useRouter } from "expo-router";
import { PayoffHero } from "@/components/art/PayoffHero";
import { OnboardingSlide } from "@/components/onboarding/OnboardingSlide";

export default function OnboardingOne() {
  const router = useRouter();
  return (
    <OnboardingSlide
      step={0}
      eyebrow="Fig. 1 · Bull call spread, illustrative"
      art={<PayoffHero />}
      title="Options built to withstand any volatility"
      body="Defined risk options strategies for NSE and BSE equities and index F&O. Probabilities you can act on, not tip sheets."
      onContinue={() => router.push("/risk-first")}
      onSkip={() => router.push("/get-started")}
    />
  );
}
