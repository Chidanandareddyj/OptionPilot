import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { CameraIcon } from "@/components/icons";
import { TextField } from "@/components/forms/TextField";
import { Avatar } from "@/components/settings/Avatar";
import { FieldCard } from "@/components/settings/FieldCard";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { Text } from "@/components/ui";
import { ACCOUNT_SESSION_KEY, useAccountSession } from "@/lib/account/hooks";
import { NAME_MAX_LENGTH, validateDisplayName, validateEmail } from "@/lib/account/model";
import { AuthError, SignedOutError, useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme/ThemeProvider";

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "info"; message: string } | { kind: "saved"; message: string } | { kind: "error"; message: string };
const IDLE: Status = { kind: "idle" };

function errorMessage(error: unknown): string | null {
  if (error instanceof SignedOutError) return null;
  if (error instanceof AuthError) return error.message;
  return "Could not save. Try again.";
}

/** Account (designs 58 and 59): avatar, display name and email. */
export default function AccountScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { user: stored, account, updateName } = useAuth();
  const session = useAccountSession();
  const user = session.data?.user ?? stored;

  // What the person has typed, or null to show what the server has. No effect copies server data in.
  const [nameDraft, setName] = useState<string | null>(null);
  const [emailDraft, setEmail] = useState<string | null>(null);
  const [nameStatus, setNameStatus] = useState<Status>(IDLE);
  const [emailStatus, setEmailStatus] = useState<Status>(IDLE);
  const name = nameDraft ?? user?.name ?? "";
  const email = emailDraft ?? user?.email ?? "";

  if (!user) return null;

  async function saveName() {
    const problem = validateDisplayName(name);
    if (problem) return setNameStatus({ kind: "error", message: problem });
    if (name.trim() === user!.name) return setNameStatus({ kind: "info", message: "No changes to save." });
    setNameStatus({ kind: "saving" });
    try {
      await updateName(name);
      queryClient.setQueryData(ACCOUNT_SESSION_KEY, (current: typeof session.data) =>
        current ? { ...current, user: { ...current.user, name: name.trim() } } : current,
      );
      setName(null);
      setNameStatus({ kind: "saved", message: "Name saved." });
    } catch (error) {
      const message = errorMessage(error);
      if (message) setNameStatus({ kind: "error", message });
    }
  }

  async function saveEmail() {
    const problem = validateEmail(email);
    if (problem) return setEmailStatus({ kind: "error", message: problem });
    if (email.trim().toLowerCase() === user!.email.toLowerCase()) {
      return setEmailStatus({ kind: "info", message: "No changes to save." });
    }
    setEmailStatus({ kind: "saving" });
    try {
      await account.changeEmail(email);
      setEmailStatus({ kind: "saved", message: "Check your inbox to confirm the new address." });
    } catch (error) {
      const message = errorMessage(error);
      if (message) setEmailStatus({ kind: "error", message });
    }
  }

  const hintFor = (status: Status, rule: string) => ({
    hint: status.kind === "idle" || status.kind === "saving" ? rule : status.message,
    hintTone: status.kind === "error" ? ("loss" as const) : status.kind === "saved" ? ("profit" as const) : ("muted" as const),
  });

  return (
    <SettingsPage title="Account" form>
      <View className="overflow-hidden rounded-2xl border border-border bg-card">
        <View className="flex-row items-center justify-between gap-4 p-4 pb-5">
          <View className="flex-1 gap-1">
            <Text size="lg" weight="semibold">
              Avatar
            </Text>
            <Text size="sm" tone="muted">
              Tap the avatar to choose a custom image.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change avatar"
            onPress={() => router.push("/settings/avatar")}
          >
            <Avatar name={user.name} email={user.email} image={user.image} />
            <View
              className="absolute -bottom-2 -right-2 h-7 w-7 items-center justify-center rounded-full border border-border bg-card"
            >
              <CameraIcon size={16} color={colors.foreground} />
            </View>
          </Pressable>
        </View>
        <View className="bg-accent px-4 py-3">
          <Text size="sm" tone="muted">
            An avatar is optional but we recommend adding one.
          </Text>
        </View>
      </View>

      <FieldCard
        title="Name"
        description="Enter your full name or a display name."
        saving={nameStatus.kind === "saving"}
        onSave={() => void saveName()}
        {...hintFor(nameStatus, `Use ${NAME_MAX_LENGTH} characters at most.`)}
      >
        <TextField
          label="Name"
          hideLabel
          value={name}
          onChangeText={(value) => {
            setName(value);
            setNameStatus(IDLE);
          }}
          invalid={nameStatus.kind === "error"}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="done"
          onSubmitEditing={() => void saveName()}
        />
      </FieldCard>

      <FieldCard
        title="Email"
        description="Enter the email address you use to log in."
        saving={emailStatus.kind === "saving"}
        onSave={() => void saveEmail()}
        {...hintFor(emailStatus, "Enter a valid email address.")}
      >
        <TextField
          label="Email"
          hideLabel
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setEmailStatus(IDLE);
          }}
          invalid={emailStatus.kind === "error"}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="done"
          onSubmitEditing={() => void saveEmail()}
        />
      </FieldCard>
    </SettingsPage>
  );
}
