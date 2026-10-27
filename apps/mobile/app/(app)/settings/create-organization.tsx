import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView } from "react-native";
import { FormAlert } from "@/components/forms/FormAlert";
import { TextField } from "@/components/forms/TextField";
import { Button, Text } from "@/components/ui";
import { ORGANIZATIONS_KEY } from "@/lib/account/hooks";
import { slugify, validateSlug } from "@/lib/account/model";
import { AuthError, SignedOutError, useAuth } from "@/lib/auth";

/** A sheet with the two fields the website's create-organization form asks for. */
export default function CreateOrganization() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { account } = useAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    const found = {
      name: name.trim().length === 0 ? "Enter a name." : undefined,
      slug: validateSlug(slug) ?? undefined,
    };
    setErrors(found);
    if (found.name || found.slug) return;
    setBusy(true);
    setFailure(null);
    try {
      await account.createOrganization(name, slug);
      await queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_KEY });
      router.back();
    } catch (error) {
      if (!(error instanceof SignedOutError)) {
        setFailure(error instanceof AuthError ? error.message : "Could not create the organization. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerClassName="gap-4 p-4 pb-8">
      <Text size="xl" weight="semibold" tight accessibilityRole="header">
        Create organization
      </Text>
      {failure ? <FormAlert title="Could not create it" message={failure} /> : null}
      <TextField
        label="Name"
        value={name}
        onChangeText={(value) => {
          setName(value);
          if (!slugEdited) setSlug(slugify(value));
          setErrors({});
        }}
        error={errors.name}
        autoCapitalize="words"
        returnKeyType="next"
      />
      <TextField
        label="Slug"
        value={slug}
        onChangeText={(value) => {
          setSlugEdited(true);
          setSlug(value.toLowerCase());
          setErrors({});
        }}
        error={errors.slug}
        returnKeyType="done"
        onSubmitEditing={() => void create()}
      />
      <Button label="Create organization" variant="primary" loading={busy} onPress={() => void create()} />
    </ScrollView>
  );
}
