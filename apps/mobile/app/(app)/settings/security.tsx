import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { View } from "react-native";
import { DesktopIcon, DeviceMobileIcon, GoogleLogoIcon } from "@/components/icons";
import { TextField } from "@/components/forms/TextField";
import { FieldCard } from "@/components/settings/FieldCard";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { Button, Skeleton, Tag, Text } from "@/components/ui";
import { SESSIONS_KEY, useAccountSession, useLinkedAccounts, useSessions } from "@/lib/account/hooks";
import { describeDevice, formatSessionDate } from "@/lib/account/model";
import { AuthError, SignedOutError, useAuth } from "@/lib/auth";
import type { SessionInfo } from "@/lib/auth/authApi";
import { PASSWORD_MIN_LENGTH, validateNewPassword, validatePasswordMatch, validatePasswordPresent } from "@/lib/auth/validation";
import { useTheme } from "@/lib/theme/ThemeProvider";

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; message: string } | { kind: "error"; message: string };
type Errors = { current?: string; next?: string; confirm?: string };

/** Security (design 61): change password, connected accounts and signed-in sessions. */
export default function SecurityScreen() {
  return (
    <SettingsPage title="Security" form>
      <ChangePasswordCard />
      <ConnectedAccountsCard />
      <SessionsCard />
    </SettingsPage>
  );
}

function ChangePasswordCard() {
  const { account } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function save() {
    const found: Errors = {
      current: validatePasswordPresent(current) ?? undefined,
      next: validateNewPassword(next) ?? undefined,
      confirm: validatePasswordMatch(next, confirm) ?? undefined,
    };
    setErrors(found);
    if (found.current || found.next || found.confirm) {
      return setStatus({ kind: "error", message: found.current ?? found.next ?? found.confirm ?? "" });
    }
    setStatus({ kind: "saving" });
    try {
      await account.changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setStatus({ kind: "saved", message: "Password updated." });
    } catch (error) {
      if (error instanceof SignedOutError) return;
      if (error instanceof AuthError && error.code === "invalid-credentials") {
        setErrors({ current: "Your current password is not right." });
        return setStatus({ kind: "error", message: "Your current password is not right." });
      }
      setStatus({ kind: "error", message: error instanceof AuthError ? error.message : "Could not update your password. Try again." });
    }
  }

  const edit = (set: (value: string) => void) => (value: string) => {
    set(value);
    setErrors({});
    setStatus({ kind: "idle" });
  };

  return (
    <FieldCard
      title="Change password"
      description="Enter your current password and a new one."
      hint={status.kind === "error" || status.kind === "saved" ? status.message : `Use ${PASSWORD_MIN_LENGTH} characters at minimum.`}
      hintTone={status.kind === "error" ? "loss" : status.kind === "saved" ? "profit" : "muted"}
      saving={status.kind === "saving"}
      onSave={() => void save()}
      plain
    >
      <View className="gap-4">
        <TextField
          label="Current password"
          password
          placeholder="Current password"
          value={current}
          onChangeText={edit(setCurrent)}
          invalid={Boolean(errors.current)}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="next"
        />
        <TextField
          label="New password"
          password
          placeholder="New password"
          value={next}
          onChangeText={edit(setNext)}
          invalid={Boolean(errors.next)}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
        />
        <TextField
          label="Confirm password"
          password
          placeholder="Confirm password"
          value={confirm}
          onChangeText={edit(setConfirm)}
          invalid={Boolean(errors.confirm)}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={() => void save()}
        />
      </View>
    </FieldCard>
  );
}

/** Read only: Google sign-in is not in the app yet, so there is nothing to link or unlink here. */
function ConnectedAccountsCard() {
  const { colors } = useTheme();
  const linked = useLinkedAccounts();
  const session = useAccountSession();
  const social = (linked.data ?? []).filter((item) => item.providerId !== "credential");
  const email = session.data?.user.email;

  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="gap-0">
        <Text size="lg" weight="semibold">
          Connected accounts
        </Text>
        <Text size="sm" tone="muted">
          Sign in with a third party service.
        </Text>
      </View>
      {linked.isPending ? (
        <Skeleton height={56} radius={12} />
      ) : linked.isError ? (
        <Text size="sm" tone="muted">
          Could not load your connected accounts.
        </Text>
      ) : social.length === 0 ? (
        <Text size="sm" tone="muted">
          No connected accounts.
        </Text>
      ) : (
        social.map((item) => (
          <View key={item.id} className="min-h-[68px] flex-row items-center gap-3 rounded-xl bg-accent p-3">
            <GoogleLogoIcon size={24} color={colors.foreground} />
            <View className="flex-1">
              <Text weight="semibold">{item.providerId === "google" ? "Google" : item.providerId}</Text>
              {email ? (
                <Text size="xs" tone="muted">
                  {email}
                </Text>
              ) : null}
            </View>
          </View>
        ))
      )}
      <Text size="xs" tone="muted">
        Connect or disconnect accounts on the OptionPilot website. The app signs in with email and password.
      </Text>
    </View>
  );
}

function SessionsCard() {
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { account } = useAuth();
  const sessions = useSessions();
  const me = useAccountSession().data?.sessionId ?? null;
  const [revoking, setRevoking] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function revoke(item: SessionInfo) {
    setRevoking(item.id);
    setProblem(null);
    try {
      await account.revokeSession(item.token);
      queryClient.setQueryData<SessionInfo[]>(SESSIONS_KEY, (list) => list?.filter((entry) => entry.id !== item.id));
    } catch (error) {
      if (!(error instanceof SignedOutError)) setProblem("Could not sign that device out. Try again.");
    } finally {
      setRevoking(null);
    }
  }

  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="gap-0">
        <Text size="lg" weight="semibold">
          Sessions
        </Text>
        <Text size="sm" tone="muted">
          Manage your active sessions and revoke access.
        </Text>
      </View>
      {sessions.isPending ? (
        <Skeleton height={64} radius={12} />
      ) : sessions.isError ? (
        <Text size="sm" tone="muted">
          Could not load your sessions.
        </Text>
      ) : (
        (sessions.data ?? []).map((item) => {
          const device = describeDevice(item.userAgent);
          const current = item.id === me;
          const Icon = /iPhone|iPad|Android|app/.test(device) ? DeviceMobileIcon : DesktopIcon;
          return (
            <View key={item.id} className="flex-row items-center gap-3 rounded-xl bg-accent p-3">
              <Icon size={24} color={colors.mutedForeground} />
              <View className="min-w-0 flex-1 gap-0.5">
                <View className="flex-row items-center gap-2">
                  <Text weight="semibold" numberOfLines={1} className="shrink">
                    {device}
                  </Text>
                  {current ? <Tag variant="outline" label="This device" /> : null}
                </View>
                <Text size="xs" tone="muted" numberOfLines={1}>
                  {[item.ipAddress, formatSessionDate(item.createdAt)].filter(Boolean).join(" · ")}
                </Text>
              </View>
              {current ? null : (
                <Button
                  label="Revoke"
                  accessibilityLabel={`Revoke ${device}`}
                  variant="ghost"
                  size="sm"
                  loading={revoking === item.id}
                  onPress={() => void revoke(item)}
                />
              )}
            </View>
          );
        })
      )}
      {problem ? (
        <Text size="sm" tone="loss" accessibilityRole="alert">
          {problem}
        </Text>
      ) : null}
    </View>
  );
}
