import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View, type TextInputInstance } from "react-native";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { AuthTitle } from "@/components/auth/AuthTitle";
import { BrandMark } from "@/components/brand/BrandMark";
import { FormAlert } from "@/components/forms/FormAlert";
import { TextField } from "@/components/forms/TextField";
import { Button, Screen, Text, TextLink } from "@/components/ui";
import { AuthError, useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { validateEmail, validatePasswordPresent } from "@/lib/auth/validation";

/** Waits this long after a field loses focus before expanding the header, so moving between fields does not flicker. */
const BLUR_GRACE_MS = 120;

export default function SignIn() {
  const router = useRouter();
  const { signIn, resendVerificationCode } = useAuth();
  const passwordRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [failure, setFailure] = useState<AuthError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // While a field has focus the keyboard is up, so the header shrinks to leave room for the form.
  const [typing, setTyping] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (blurTimer.current && clearTimeout(blurTimer.current)), []);
  const focusProps = {
    onFocus: () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
      setTyping(true);
    },
    onBlur: () => {
      blurTimer.current = setTimeout(() => setTyping(false), BLUR_GRACE_MS);
    },
  };

  const badCredentials = failure?.code === "invalid-credentials";
  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  async function submit() {
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePasswordPresent(password);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFailure(null);
    if (nextEmailError || nextPasswordError) return;

    setSubmitting(true);
    try {
      await signIn(email, password);
      // The root layout swaps this group for the app as soon as the session exists.
    } catch (error) {
      if (error instanceof AuthError && error.code === "email-not-verified") {
        await resendVerificationCode(email).catch(() => {});
        router.push({ pathname: "/verify-email", params: { email: email.trim() } });
      } else {
        setFailure(error instanceof AuthError ? error : new AuthError("unknown", "Something went wrong. Try again."));
      }
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll form>
      {typing ? (
        <View className="mt-2">
          <View className="h-11 flex-row items-center gap-3">
            <BrandMark size={32} />
            <Text size="3xl" weight="semibold" tight accessibilityRole="header">
              Sign in
            </Text>
          </View>
          <Text size="sm" tone="muted" className="mt-1">
            Enter your email to log in to your account.
          </Text>
        </View>
      ) : (
        <>
          <View className="h-11" />
          <View className="mt-2">
            <BrandMark size={40} />
          </View>
          <AuthTitle title="Sign in">Enter your email to log in to your account.</AuthTitle>
        </>
      )}

      <View className={cn("gap-4", typing ? "mt-4" : failure ? "mt-6" : "mt-8")}>
        {failure ? <FormAlert title="Could not sign in" message={failure.message} /> : null}
        <TextField
          label="Email"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setEmailError(null);
          }}
          error={emailError}
          invalid={badCredentials}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
          {...focusProps}
        />
        <TextField
          label="Password"
          inputRef={passwordRef}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setPasswordError(null);
          }}
          error={passwordError}
          invalid={badCredentials}
          placeholder="Password"
          password
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => canSubmit && void submit()}
          labelRight={<TextLink label="Forgot your password?" onPress={() => router.push("/forgot-password")} />}
          {...focusProps}
        />
        <Button label="Log in" variant="primary" disabled={!canSubmit} loading={submitting} onPress={() => void submit()} />
      </View>

      {typing ? null : (
        <AuthFooter prompt="Don't have an account?" action="Sign up" onPress={() => router.push("/sign-up")} />
      )}
    </Screen>
  );
}
