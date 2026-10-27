import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { CameraIcon, ImageIcon, TrashIcon } from "@/components/icons";
import { Text } from "@/components/ui";
import { pickAvatar } from "@/lib/account/avatar";
import { ACCOUNT_SESSION_KEY } from "@/lib/account/hooks";
import { AuthError, SignedOutError, useAuth } from "@/lib/auth";
import { useScreenInsets } from "@/lib/safe-area";
import { surfaceColors } from "@/lib/theme/colors";
import { useTheme } from "@/lib/theme/ThemeProvider";
import type { AccountSession } from "@/lib/auth/authApi";

/** The avatar action sheet (design 60): choose a photo, take one, or remove the current one. */
export default function AvatarSheet() {
  const router = useRouter();
  const insets = useScreenInsets();
  const queryClient = useQueryClient();
  const { scheme, colors } = useTheme();
  const surface = surfaceColors(scheme);
  const { account } = useAuth();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function save(image: string | null) {
    await account.updateImage(image);
    queryClient.setQueryData<AccountSession>(ACCOUNT_SESSION_KEY, (current) =>
      current ? { ...current, user: { ...current.user, image } } : current,
    );
    router.back();
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setProblem(null);
    try {
      await action();
    } catch (error) {
      if (!(error instanceof SignedOutError)) {
        setProblem(error instanceof AuthError ? error.message : "Could not update your avatar. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function choose(source: "library" | "camera") {
    await run(async () => {
      const picked = await pickAvatar(source);
      if (picked.status === "picked") return save(picked.image);
      if (picked.status === "denied") {
        setProblem("Allow camera access in your device settings to take a photo.");
      } else if (picked.status === "failed") {
        setProblem("Could not use that photo. Try another.");
      }
    });
  }

  const rows = [
    { label: "Choose from library", icon: ImageIcon, onPress: () => void choose("library"), danger: false },
    { label: "Take photo", icon: CameraIcon, onPress: () => void choose("camera"), danger: false },
    { label: "Remove avatar", icon: TrashIcon, onPress: () => void run(() => save(null)), danger: true },
  ];

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
          <View className="items-center p-3">
            <Text size="sm" tone="muted">
              {busy ? "Saving your avatar" : "Change avatar"}
            </Text>
          </View>
          {rows.map((row) => (
            <Pressable
              key={row.label}
              accessibilityRole="button"
              accessibilityLabel={row.label}
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={row.onPress}
              className="h-14 flex-row items-center justify-center gap-2 border-t border-border"
            >
              <row.icon size={24} color={row.danger ? colors.loss : colors.foreground} />
              <Text size="lg" weight="medium" tone={row.danger ? "loss" : "foreground"}>
                {row.label}
              </Text>
            </Pressable>
          ))}
          {problem ? (
            <View className="border-t border-border px-4 py-3" accessibilityRole="alert">
              <Text size="sm" tone="loss" className="text-center">
                {problem}
              </Text>
            </View>
          ) : null}
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
