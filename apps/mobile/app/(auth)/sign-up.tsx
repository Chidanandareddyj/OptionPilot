import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { View, type TextInputInstance } from "react-native";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { AuthTitle } from "@/components/auth/AuthTitle";
import { BackLink } from "@/components/auth/BackLink";
import { FormAlert } from "@/components/forms/FormAlert";
import { TextField } from "@/components/forms/TextField";
import { Button, Screen } from "@/components/ui";
import { AuthError, useAuth } from "@/lib/auth";
import {
  validateEmail,
  validateName,
  validateNewPassword,
  validatePasswordMatch,
} from "@/lib/auth/validation";

type FieldErrors = { name?: string; email?: string; password?: string; confirm?: string };

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useAuth();
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<AuthError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Edits clear that field's message, so an error never outlives the fix. */
  function edit(field: keyof FieldErrors, set: (value: string) => void) {
    return (value: string) => {
      set(value);
      setErrors((current) => ({ ...current, [field]: undefined }));
    };
  }

  async function submit() {
    const next: FieldErrors = {
      name: validateName(name) ?? undefined,
      email: validateEmail(email) ?? undefined,
      password: validateNewPassword(password) ?? undefined,
      confirm: validatePasswordMatch(password, confirm) ?? undefined,
    };
    setErrors(next);
    setFailure(null);
    if (Object.values(next).some(Boolean)) return;

    setSubmitting(true);
    try {
      await signUp({ name, email, password });
      router.replace({ pathname: "/verify-email", params: { email: email.trim() } });
    } catch (error) {
      setFailure(error instanceof AuthError ? error : new AuthError("unknown", "Something went wrong. Try again."));
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll form>
      <BackLink onPress={() => (router.canGoBack() ? router.back() : router.replace("/sign-in"))} />
      <AuthTitle title="Create your account" className="mt-2">
        Free forever. It takes under a minute.
      </AuthTitle>

      <View className="mt-6 gap-3">
        {failure ? (
          <FormAlert
            title={failure.code === "user-exists" ? "Account already exists" : "Could not create account"}
            message={failure.message}
          />
        ) : null}
        <TextField
          label="Name"
          value={name}
          onChangeText={edit("name", setName)}
          error={errors.name}
          placeholder="Your full name"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <TextField
          label="Email"
          inputRef={emailRef}
          value={email}
          onChangeText={edit("email", setEmail)}
          error={errors.email}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          label="Password"
          inputRef={passwordRef}
          value={password}
          onChangeText={edit("password", setPassword)}
          error={errors.password}
          placeholder="Password"
          password
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <TextField
          label="Confirm password"
          inputRef={confirmRef}
          value={confirm}
          onChangeText={edit("confirm", setConfirm)}
          error={errors.confirm}
          placeholder="Confirm password"
          password
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
      </View>

      <View className="mt-6">
        <Button label="Create account" variant="primary" loading={submitting} onPress={() => void submit()} />
      </View>

      <AuthFooter prompt="Already have an account?" action="Sign in" onPress={() => router.replace("/sign-in")} />
    </Screen>
  );
}
