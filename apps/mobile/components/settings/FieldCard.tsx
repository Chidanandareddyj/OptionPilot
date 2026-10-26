import type { ReactNode } from "react";
import { View } from "react-native";
import { Button, Text } from "@/components/ui";

type FieldCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  /** What the strip at the bottom says: a rule ("Use 32 characters at most."), or the result of the last save. */
  hint: string;
  hintTone?: "muted" | "loss" | "profit";
  onSave: () => void;
  saving?: boolean;
  saveLabel?: string;
  /** No tinted strip: the hint and Save sit on the card itself, as on the security card. */
  plain?: boolean;
};

/** A Settings card with a heading, one or more fields, and a strip with a hint and the Save button. */
export function FieldCard({
  title,
  description,
  children,
  hint,
  hintTone = "muted",
  onSave,
  saving = false,
  saveLabel = "Save",
  plain = false,
}: FieldCardProps) {
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <View className={plain ? "gap-4 p-4 pb-3" : "gap-4 p-4 pb-5"}>
        <View className="gap-1">
          <Text size="lg" weight="semibold">
            {title}
          </Text>
          <Text size="sm" tone="muted">
            {description}
          </Text>
        </View>
        {children}
      </View>
      <View className={plain ? "flex-row items-center justify-between gap-3 px-4 pb-4" : "flex-row items-center justify-between gap-3 bg-accent px-4 py-3"}>
        <Text size={plain ? "xs" : "sm"} tone={hintTone} className="flex-1" accessibilityLiveRegion="polite">
          {hint}
        </Text>
        <Button label={saveLabel} accessibilityLabel={`${saveLabel} ${title.toLowerCase()}`} variant="primary" size="sm" loading={saving} onPress={onSave} />
      </View>
    </View>
  );
}
