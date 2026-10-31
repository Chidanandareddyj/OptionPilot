import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { SignOutIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useScreenInsets } from "@/lib/safe-area";
import { surfaceColors } from "@/lib/theme/colors";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** Confirmation for signing out, drawn as an action sheet over Settings (design 64). */
export default function SignOutConfirm() {
  const router = useRouter();
  const insets = useScreenInsets();
  const { scheme, colors } = useTheme();
  const surface = surfaceColors(scheme);
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    // Clearing the session makes the root layout leave the app group, so nothing is navigated here.
    await signOut();
  }

  return (
    <View className="flex-1 justify-end">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        onPress={() => router.back()}
        className="absolute inset-0"
        style={{ backgroundColor: surface.scrim }}
      />
      <View className="gap-2 px-2" style={{ paddingBottom: Math.max(insets.bottom - 2, 16) }}>
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          <View className="items-center gap-1 p-4">
            <Text weight="semibold">Sign out of OptionPilot?</Text>
            {user ? (
              <Text size="sm" tone="muted">
                {user.email}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            accessibilityState={{ busy, disabled: busy }}
            disabled={busy}
            onPress={() => void confirm()}
            className="h-14 flex-row items-center justify-center gap-2 border-t border-border"
          >
            <SignOutIcon size={24} color={colors.loss} />
            <Text size="lg" weight="medium" tone="loss">
              {busy ? "Signing out" : "Sign out"}
            </Text>
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          disabled={busy}
          onPress={() => router.back()}
          className="h-14 items-center justify-center rounded-2xl border border-border bg-card"
        >
          <Text size="lg" weight="medium">
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
