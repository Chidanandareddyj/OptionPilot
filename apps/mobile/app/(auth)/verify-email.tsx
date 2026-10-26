import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { AuthTitle, Emphasis } from "@/components/auth/AuthTitle";
import { BackLink } from "@/components/auth/BackLink";
import { IconTile } from "@/components/auth/IconTile";
import { CheckCircleIcon, EnvelopeSimpleIcon } from "@/components/icons";
import { FormAlert } from "@/components/forms/FormAlert";
import { OtpInput } from "@/components/forms/OtpInput";
import { Button, Screen, Text, TextLink } from "@/components/ui";
import { AuthError, useAuth } from "@/lib/auth";
import { OTP_LENGTH, validateOtp } from "@/lib/auth/validation";
import { surfaceColors } from "@/lib/theme/colors";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { formatClock, useCountdown } from "@/lib/useCountdown";

/** Seconds before another code can be requested. */
const RESEND_WAIT_S = 30;
/** Seconds the "Email verified" card shows before sign-in opens. */
const REDIRECT_S = 3;

export default function VerifyEmail() {
  const router = useRouter();
  const { scheme, colors } = useTheme();
  const surface = surfaceColors(scheme);
  const { verifyEmail, resendVerificationCode } = useAuth();
  const { email = "" } = useLocalSearchParams<{ email?: string }>();

  const [code, setCode] = useState("");
  const [failure, setFailure] = useState<AuthError | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);
  const resend = useCountdown(RESEND_WAIT_S);
  const redirect = useCountdown(REDIRECT_S);

  // After verifying, show the confirmation for a moment and then open sign-in.
  useEffect(() => {
    if (verified && redirect.remaining === 0) router.replace("/sign-in");
  }, [verified, redirect.remaining, router]);

  async function submit() {
    const invalid = validateOtp(code);
    setCodeError(invalid);
    setFailure(null);
    if (invalid) return;

    setSubmitting(true);
    try {
      await verifyEmail(email, code);
      redirect.restart();
      setVerified(true);
    } catch (error) {
      setFailure(error instanceof AuthError ? error : new AuthError("unknown", "Something went wrong. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  async function sendAgain() {
    setFailure(null);
    setCode("");
    try {
      await resendVerificationCode(email);
      resend.restart();
    } catch (error) {
      setFailure(error instanceof AuthError ? error : new AuthError("unknown", "Could not send a new code. Try again."));
    }
  }

  return (
    <View className="flex-1 bg-background">
      <Screen scroll form>
        {verified ? (
          <View className="h-11" />
        ) : (
          <BackLink onPress={() => (router.canGoBack() ? router.back() : router.replace("/sign-up"))} />
        )}
        <View className="mt-2">
          <IconTile icon={EnvelopeSimpleIcon} />
        </View>
        <AuthTitle title="Verify your email">
          Enter the {OTP_LENGTH} digit code we sent to <Emphasis>{email}</Emphasis>.
        </AuthTitle>

        <View className="mt-6 gap-4">
          {failure ? <FormAlert title="Could not verify" message={failure.message} /> : null}
          <OtpInput
            value={code}
            onChangeText={(value) => {
              setCode(value);
              setCodeError(null);
            }}
            invalid={Boolean(failure) || Boolean(codeError)}
            autoFocus
          />
          {codeError ? (
            <Text size="xs" tone="loss">
              {codeError}
            </Text>
          ) : null}
        </View>

        <View className="mt-4 flex-row items-center justify-between">
          {resend.remaining > 0 ? (
            <Text size="sm" tone="muted">
              Resend code in <Text size="sm" mono tone="muted">{formatClock(resend.remaining)}</Text>
            </Text>
          ) : (
            <TextLink label="Resend code" onPress={() => void sendAgain()} />
          )}
          <TextLink label="Change email" onPress={() => router.replace("/sign-up")} />
        </View>

        <View className="mt-6">
          <Button
            label="Verify email"
            variant="primary"
            disabled={code.length < OTP_LENGTH}
            loading={submitting}
            onPress={() => void submit()}
          />
        </View>
      </Screen>

      {verified ? (
        <View
          className="absolute inset-0 items-center justify-center px-8"
          style={{ backgroundColor: surface.scrim }}
          accessibilityViewIsModal
        >
          <View
            accessibilityRole="alert"
            className="w-full items-center gap-3 rounded-3xl border border-border bg-card px-6 py-8"
          >
            <View
              className="h-16 w-16 items-center justify-center rounded-xl"
              style={{ backgroundColor: surface.profitFill }}
            >
              <CheckCircleIcon size={40} weight="fill" color={colors.profit} />
            </View>
            <Text size="xl" weight="semibold" tight>
              Email verified
            </Text>
            <Text size="sm" tone="muted">
              Redirecting to sign in in{" "}
              <Text size="sm" mono tone="muted">
                {redirect.remaining}
              </Text>
              s
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
