import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import type { Category } from "@optionpilot/shared";
import { FormAlert } from "@/components/forms/FormAlert";
import { SparkleIcon, XIcon } from "@/components/icons";
import { MaxLossField } from "@/components/recommend/MaxLossField";
import { ViewPicker } from "@/components/recommend/ViewPicker";
import { Button, SegmentedControl, Text } from "@/components/ui";
import { DEFAULT_MAX_LOSS, decideErrorMessage, decideInput } from "@/lib/analysis/recommend";
import { asDecision } from "@optionpilot/shared";
import { useAnalysis, useDecide } from "@/lib/api/hooks";
import { useScreenInsets } from "@/lib/safe-area";
import { useTheme } from "@/lib/theme/ThemeProvider";

type Pane = "left" | "right";

/** The panes start on the website's own views: bullish on the left, bearish on the right. */
const PANE_DEFAULT: Record<Pane, Category> = { left: "bullish", right: "bearish" };

/** Presented as a form sheet over the analysis, Compare or the result (see (app)/_layout.tsx). */
export default function RecommendSheet() {
  const router = useRouter();
  const insets = useScreenInsets();
  const { colors } = useTheme();
  const { id, pane: paneParam, from } = useLocalSearchParams<{ id: string; pane?: Pane; from?: string }>();
  const detail = useAnalysis(id);
  const decide = useDecide(id);

  const saved = asDecision(detail.data?.decision);
  const [pane, setPane] = useState<Pane | undefined>(paneParam === "left" || paneParam === "right" ? paneParam : undefined);
  const [view, setView] = useState<Category>(saved?.view ?? (pane ? PANE_DEFAULT[pane] : "bullish"));
  const [amount, setAmount] = useState(String(saved?.max_loss_budget ?? DEFAULT_MAX_LOSS));

  const input = decideInput(id, view, amount, pane);
  const scoring = decide.isPending;

  const submit = () => {
    if (!input || scoring) return;
    decide.mutate(input, {
      onSuccess: () => {
        // From the result screen the sheet closes onto it, which re-reads the new answer. Anywhere else a new result opens.
        if (pane || from === "result") router.back();
        else router.replace({ pathname: "/analysis/[id]/recommendation", params: { id } });
      },
    });
  };

  const choosePane = (next: Pane) => {
    setPane(next);
    setView(PANE_DEFAULT[next]);
    decide.reset();
  };

  return (
    <View className="bg-card px-4 pt-6" style={{ paddingBottom: Math.max(insets.bottom, 24) + 8 }}>
      <View className="mb-4 flex-row items-center">
        <Text size="2xl" weight="semibold" tight accessibilityRole="header" className="flex-1">
          Which strategy fits?
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={8}
          className="h-8 w-8 items-center justify-center rounded-full border border-border bg-card"
        >
          <XIcon size={16} weight="bold" color={colors.foreground} />
        </Pressable>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets scrollEnabled={false} contentContainerClassName="gap-4">
        {pane ? (
          <SegmentedControl
            segments={[
              { value: "left", label: "Left view" },
              { value: "right", label: "Right view" },
            ]}
            value={pane}
            onChange={choosePane}
          />
        ) : null}
        <ViewPicker value={view} onChange={setView} disabled={scoring} />
        <MaxLossField
          value={amount}
          onChangeText={(text) => {
            setAmount(text);
            if (decide.isError) decide.reset();
          }}
          onSubmit={submit}
          invalid={amount !== "" && input === null}
          disabled={scoring}
        />
        {decide.isError ? <FormAlert title="Recommendation failed" message={decideErrorMessage(decide.error)} /> : null}
        <Button
          label={scoring ? "Scoring…" : "Recommend"}
          variant="primary"
          icon={scoring ? undefined : SparkleIcon}
          loading={scoring}
          disabled={!input}
          onPress={submit}
        />
      </ScrollView>
    </View>
  );
}
