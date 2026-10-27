import { useRouter } from "expo-router";
import { View } from "react-native";
import { BuildingsIcon, PlusIcon } from "@/components/icons";
import { FormAlert } from "@/components/forms/FormAlert";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { Button, Skeleton, Text } from "@/components/ui";
import { useOrganizations } from "@/lib/account/hooks";
import { initials } from "@/lib/account/model";
import { useScreenInsets } from "@/lib/safe-area";
import { useTheme } from "@/lib/theme/ThemeProvider";

/** Organizations (design 62): the ones you belong to, as the website lists them, and a way to create one. */
export default function OrganizationsScreen() {
  const router = useRouter();
  const insets = useScreenInsets();
  const { colors } = useTheme();
  const organizations = useOrganizations();
  const list = organizations.data ?? [];

  const footer = (
    <View className="border-t border-border bg-background px-4 pt-3" style={{ paddingBottom: Math.max(insets.bottom - 2, 16) }}>
      <Button
        label="Create organization"
        variant="primary"
        icon={PlusIcon}
        onPress={() => router.push("/settings/create-organization")}
      />
    </View>
  );

  return (
    <SettingsPage title="Organizations" footer={footer}>
      {organizations.isPending ? (
        <View className="gap-3" testID="organizations-loading">
          <Skeleton height={72} radius={16} />
          <Skeleton height={72} radius={16} />
        </View>
      ) : organizations.isError ? (
        <View className="gap-4">
          <FormAlert title="Could not load organizations" message="Check your connection and try again." />
          <Button label="Try again" onPress={() => void organizations.refetch()} />
        </View>
      ) : list.length === 0 ? (
        <View className="items-center gap-4 px-2 pt-12">
          <View className="h-16 w-16 items-center justify-center rounded-xl bg-accent">
            <BuildingsIcon size={32} color={colors.mutedForeground} />
          </View>
          <Text size="2xl" weight="semibold" tight className="text-center">
            No organizations yet
          </Text>
          <Text tone="muted" className="text-center">
            Create an organization to share saved analyses and strategy snapshots with other users. You can invite people after it is created.
          </Text>
        </View>
      ) : (
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          {list.map((organization, index) => (
            <View
              key={organization.id}
              accessible
              accessibilityLabel={`${organization.name}, ${organization.slug}`}
              className={`flex-row items-center gap-3 px-4 py-3 ${index === 0 ? "" : "border-t border-border"}`}
            >
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Text weight="semibold">{initials(organization.name, organization.slug)}</Text>
              </View>
              <View className="min-w-0 flex-1">
                <Text weight="semibold" numberOfLines={1}>
                  {organization.name}
                </Text>
                <Text size="sm" tone="muted" numberOfLines={1}>
                  {organization.slug}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </SettingsPage>
  );
}
