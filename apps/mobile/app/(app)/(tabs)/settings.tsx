import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { APPEARANCE_ROW_VALUE } from "@/components/appearance/options";
import {
  BellIcon,
  BuildingsIcon,
  CaretRightIcon,
  MoonStarsIcon,
  ShieldCheckIcon,
  SignOutIcon,
  TrashIcon,
  UserCircleIcon,
} from "@/components/icons";
import { TAB_BAR_CLEARANCE } from "@/components/navigation/FloatingTabBar";
import { Avatar } from "@/components/settings/Avatar";
import { SettingsSkeleton } from "@/components/settings/SettingsSkeleton";
import { ListGroup, ListRow, Screen, Text } from "@/components/ui";
import { useAccountSession } from "@/lib/account/hooks";
import { useAuth } from "@/lib/auth";
import { pushIsOn } from "@/lib/notifications/push";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** Settings home (design 56). While the account details load it shows the skeleton (57). */
export default function SettingsTab() {
  const router = useRouter();
  const { colors, appearance } = useTheme();
  const { user: stored } = useAuth();
  const session = useAccountSession();
  const [alertsOn, setAlertsOn] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let live = true;
      void pushIsOn().then((on) => {
        if (live) setAlertsOn(on);
      });
      return () => {
        live = false;
      };
    }, []),
  );

  // A failed refresh falls back to the identity saved on this device, so Settings still opens offline.
  const user = session.data?.user ?? (session.isError ? stored : null);

  return (
    <Screen scroll bottomSpace={TAB_BAR_CLEARANCE}>
      <View className="pt-[46px]">
        <Text size="sm" tone="muted">
          Account
        </Text>
        <Text size="4xl" weight="semibold" tight accessibilityRole="header" className="mt-[3px]">
          Settings
        </Text>
      </View>

      {!user ? (
        <View className="mt-4">
          <SettingsSkeleton />
        </View>
      ) : (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${user.name || user.email}, ${user.email}`}
            accessibilityHint="Opens your account"
            onPress={() => router.push("/settings/account")}
            className="mt-4 flex-row items-center gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <Avatar name={user.name} email={user.email} image={user.image} />
            <View className="min-w-0 flex-1">
              <Text weight="semibold" numberOfLines={1}>
                {user.name || user.email}
              </Text>
              <Text size="sm" tone="muted" numberOfLines={1}>
                {user.email}
              </Text>
            </View>
            <CaretRightIcon size={16} weight="bold" color={colors.faint} />
          </Pressable>

          <View className="mt-6">
            <ListGroup>
              <ListRow first icon={UserCircleIcon} label="Account" onPress={() => router.push("/settings/account")} />
              <ListRow icon={ShieldCheckIcon} label="Security" onPress={() => router.push("/settings/security")} />
              <ListRow icon={BuildingsIcon} label="Organizations" onPress={() => router.push("/settings/organizations")} />
            </ListGroup>
          </View>

          <View className="mt-4">
            <ListGroup>
              <ListRow
                first
                icon={MoonStarsIcon}
                label="Appearance"
                value={APPEARANCE_ROW_VALUE[appearance]}
                onPress={() => router.push("/appearance")}
              />
              <ListRow
                icon={BellIcon}
                label="Notifications"
                value={alertsOn ? "On" : "Off"}
                onPress={() => router.push("/settings/notifications")}
              />
            </ListGroup>
          </View>

          <View className="mt-4">
            <ListGroup>
              <ListRow first danger icon={SignOutIcon} label="Sign out" onPress={() => router.push("/sign-out")} />
            </ListGroup>
          </View>

          <View className="mt-4">
            <ListGroup>
              <ListRow first danger icon={TrashIcon} label="Delete account" onPress={() => router.push("/settings/delete-account")} />
            </ListGroup>
          </View>

          <Text size="xs" tone="muted" className="mt-6 text-center">
            OptionPilot · MIT licensed · Market data from Upstox
          </Text>
        </>
      )}
    </Screen>
  );
}
