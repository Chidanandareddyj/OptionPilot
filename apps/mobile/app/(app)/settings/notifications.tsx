import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Switch, View } from "react-native";
import { FormAlert } from "@/components/forms/FormAlert";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { Text } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { disablePush, enablePush, pushIsOn } from "@/lib/notifications/push";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** Opt-in price alerts. Nothing is sent until this switch is on. */
export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { apiFetch } = useAuth();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      void pushIsOn().then((enabled) => {
        if (live) setOn(enabled);
      });
      return () => {
        live = false;
      };
    }, []),
  );

  async function toggle(next: boolean) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setDenied(false);
    try {
      if (next) {
        const result = await enablePush(apiFetch);
        setOn(result === "on");
        setDenied(result === "denied");
        if (result === "unavailable") setError("Push alerts need the iOS or Android app.");
      } else {
        await disablePush(apiFetch);
        setOn(false);
      }
    } catch (caught) {
      setOn(await pushIsOn());
      setError(caught instanceof Error ? caught.message : "Could not update alerts.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsPage title="Notifications">
      <Text size="sm" tone="muted">
        While NSE is open, OptionPilot can alert you when a saved analysis moves more than 2% from the price you saved, or crosses one of its breakevens. Alerts stay off until you turn them on.
      </Text>
      <View className="h-14 flex-row items-center justify-between rounded-2xl border border-border bg-card px-4">
        <Text weight="medium">Price alerts</Text>
        <Switch
          accessibilityLabel="Price alerts"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          value={on}
          onValueChange={(value) => void toggle(value)}
          trackColor={{ false: colors.accent, true: colors.primary }}
          thumbColor="#ffffff"
        />
      </View>
      {denied ? (
        <FormAlert title="Notifications are blocked" message="Allow notifications for OptionPilot in your phone's settings, then turn this on again." />
      ) : null}
      {error ? <FormAlert title="Could not update alerts" message={error} /> : null}
    </SettingsPage>
  );
}
