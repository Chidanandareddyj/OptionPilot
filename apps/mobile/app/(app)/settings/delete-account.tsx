import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { FormAlert } from "@/components/forms/FormAlert";
import { TextField } from "@/components/forms/TextField";
import { TrashIcon } from "@/components/icons";
import { Button, Text } from "@/components/ui";
import { DELETE_PHRASE, matchesDeletePhrase } from "@/lib/account/model";
import { SignedOutError, useAuth } from "@/lib/auth";

type Stage =
  | { kind: "confirm" }
  | { kind: "deleting" }
  | { kind: "failed" }
  /** The saved analyses are gone, but the login could not be removed. */
  | { kind: "loginRemains" };

/**
 * Deleting the account. The design has no screen for this, so it follows the sign-out sheet and adds
 * a typed confirmation, because it cannot be undone.
 */
export default function DeleteAccountSheet() {
  const router = useRouter();
  const { user, deleteAccount, signOut } = useAuth();
  const [phrase, setPhrase] = useState("");
  const [stage, setStage] = useState<Stage>({ kind: "confirm" });
  const busy = stage.kind === "deleting";

  async function confirm() {
    if (!matchesDeletePhrase(phrase)) return;
    setStage({ kind: "deleting" });
    try {
      const { loginDeleted } = await deleteAccount();
      // A deleted login signs the app out, and the root layout leaves the signed-in screens.
      if (!loginDeleted) setStage({ kind: "loginRemains" });
    } catch (error) {
      if (!(error instanceof SignedOutError)) setStage({ kind: "failed" });
    }
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerClassName="gap-4 p-4 pb-8">
      <View className="gap-1">
        <Text size="xl" weight="semibold" tight accessibilityRole="header">
          Delete your account?
        </Text>
        {user ? (
          <Text size="sm" tone="muted">
            {user.email}
          </Text>
        ) : null}
      </View>

      {stage.kind === "loginRemains" ? (
        <>
          <FormAlert
            title="Your analyses are deleted"
            message="We could not remove your login, so it still exists. Try again, or sign out and ask for it to be removed."
          />
          <Button label="Try again" variant="danger" icon={TrashIcon} onPress={() => void confirm()} />
          <Button label="Sign out" onPress={() => void signOut()} />
        </>
      ) : (
        <>
          <Text tone="muted">
            This permanently deletes your saved analyses and your OptionPilot login. It cannot be undone.
          </Text>
          {stage.kind === "failed" ? (
            <FormAlert title="Could not delete your account" message="Nothing was deleted. Check your connection and try again." />
          ) : null}
          <TextField
            label={`Type ${DELETE_PHRASE} to confirm`}
            value={phrase}
            onChangeText={(value) => {
              setPhrase(value);
              if (stage.kind === "failed") setStage({ kind: "confirm" });
            }}
            autoCapitalize="characters"
            returnKeyType="done"
            editable={!busy}
            onSubmitEditing={() => void confirm()}
          />
          <Button
            label="Delete account"
            variant="danger"
            icon={TrashIcon}
            loading={busy}
            disabled={!matchesDeletePhrase(phrase)}
            onPress={() => void confirm()}
          />
          <Button label="Cancel" variant="ghost" disabled={busy} onPress={() => router.back()} />
        </>
      )}
    </ScrollView>
  );
}
