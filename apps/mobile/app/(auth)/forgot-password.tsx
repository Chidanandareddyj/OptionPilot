import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Platform, View } from "react-native";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { AuthTitle, Emphasis } from "@/components/auth/AuthTitle";
import { BackLink } from "@/components/auth/BackLink";
import { IconTile } from "@/components/auth/IconTile";
import { EnvelopeSimpleIcon, EnvelopeSimpleOpenIcon, LockKeyIcon } from "@/components/icons";
import { FormAlert } from "@/components/forms/FormAlert";
import { TextField } from "@/components/forms/TextField";
import { Button, Screen, Text, TextLink } from "@/components/ui";
import { AuthError, useAuth } from "@/lib/auth";
import { validateEmail } from "@/lib/auth/validation";
import { useScreenInsets } from "@/lib/safe-area";

/** iOS opens the Mail inbox with `message:`. Android has no inbox scheme, so `mailto:` opens a mail app. */
const MAIL_URL = Platform.OS === "ios" ? "message://" : "mailto:";

export default function ForgotPassword() {
  const router = useRouter();
  const insets = useScreenInsets();
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [failure, setFailure] = useState<AuthError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function send(address: string) {
    setFailure(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(address);
      setSentTo(address.trim());
    } catch (error) {
      setFailure(error instanceof AuthError ? error : new AuthError("unknown", "Something went wrong. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  async function submit() {
    const invalid = validateEmail(email);
    setEmailError(invalid);
    if (!invalid) await send(email);
  }

  if (sentTo) {
    return (
      <Screen scroll form>
        <BackLink label="Sign in" onPress={() => router.replace("/sign-in")} />
        <View className="mt-24 items-center gap-4">
          <IconTile icon={EnvelopeSimpleOpenIcon} size={80} />
          <Text size="3xl" weight="semibold" tight accessibilityRole="header">
            Check your email
          </Text>
          <Text tone="muted" className="max-w-[320px] text-center">
            We sent a reset link to <Emphasis>{sentTo}</Emphasis>. Open it on this phone to choose a new password.
          </Text>
        </View>

        <View className="mt-auto gap-3 pt-6" style={{ paddingBottom: Math.max(insets.bottom + 14, 24) }}>
          {failure ? <FormAlert title="Could not send" message={failure.message} /> : null}
          <Button
            label="Open email app"
            variant="primary"
            icon={EnvelopeSimpleIcon}
            onPress={() => void Linking.openURL(MAIL_URL).catch(() => {})}
          />
          <Button label="Back to sign in" variant="ghost" onPress={() => router.replace("/sign-in")} />
          <View className="flex-row items-center justify-center gap-1">
            <Text size="sm" tone="muted">
              Did not get it?
            </Text>
            <TextLink label="Send again" disabled={submitting} onPress={() => void send(sentTo)} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll form>
      <BackLink label="Sign in" onPress={() => router.replace("/sign-in")} />
      <View className="mt-2">
        <IconTile icon={LockKeyIcon} />
      </View>
      <AuthTitle title="Forgot password">Enter your email and we will send you a link to reset your password.</AuthTitle>

      <View className="mt-6 gap-4">
        {failure ? <FormAlert title="Could not send" message={failure.message} /> : null}
        <TextField
          label="Email"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setEmailError(null);
          }}
          error={emailError}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="username"
          returnKeyType="send"
          onSubmitEditing={() => void submit()}
        />
        <Button label="Send reset link" variant="primary" loading={submitting} onPress={() => void submit()} />
      </View>

      <AuthFooter prompt="Remembered it?" action="Back to sign in" onPress={() => router.replace("/sign-in")} />
    </Screen>
  );
}
