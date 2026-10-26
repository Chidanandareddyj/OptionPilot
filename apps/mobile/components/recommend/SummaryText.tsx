import { View } from "react-native";
import { Text } from "@/components/ui";
import { summaryLines } from "@/lib/analysis/recommend";

/** The model's explanation, shown as paragraphs, headings and bullets. */
export function SummaryText({ text }: { text: string }) {
  return (
    <View className="gap-2">
      {summaryLines(text).map((line, index) =>
        line.kind === "heading" ? (
          <Text key={index} weight="semibold" accessibilityRole="header">
            {line.text}
          </Text>
        ) : line.kind === "bullet" ? (
          <View key={index} className="flex-row gap-2">
            <Text size="sm" tone="muted">
              •
            </Text>
            <Text size="sm" tone="muted" className="flex-1">
              {line.text}
            </Text>
          </View>
        ) : (
          <Text key={index} size="sm" tone="muted">
            {line.text}
          </Text>
        ),
      )}
    </View>
  );
}
