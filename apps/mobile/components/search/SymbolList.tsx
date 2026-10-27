import { FlatList, Pressable, View } from "react-native";
import type { Suggestion } from "@optionpilot/shared";
import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";

type SymbolListProps = {
  query: string;
  results: Suggestion[];
  onSelect: (symbol: string) => void;
};

/** Matches for the search sheet. With a query typed, the first row is the one Return picks. */
export function SymbolList({ query, results, onSelect }: SymbolListProps) {
  const typed = query.trim();
  const count = results.length;

  return (
    <>
      <View className="mb-1 mt-4 flex-row items-center justify-between">
        <Text size="sm" tone="muted">
          {typed ? "Matching derivatives" : "Popular F&O stocks"}
        </Text>
        <Text size="xs" mono tone="faint">
          {count} {count === 1 ? "result" : "results"}
        </Text>
      </View>

      {count === 0 ? (
        <View className="gap-1 px-4 py-2">
          <Text size="sm" tone="muted">
            No predefined match for “<Text size="sm">{typed}</Text>”.
          </Text>
          <Text size="xs" tone="muted">
            Tap Analyze to query it directly.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.symbol}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="-mx-2 pb-6"
          renderItem={({ item, index }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.symbol}, ${item.name}`}
              onPress={() => onSelect(item.symbol)}
              className={cn("min-h-14 flex-row items-center gap-3 rounded-xl px-4 py-3", index === 0 && typed && "bg-accent")}
            >
              <View className="flex-1">
                <Text weight="semibold">{item.symbol}</Text>
                <Text size="xs" tone="muted" numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
              <Text size="xs" tone="muted">
                {item.sector}
              </Text>
            </Pressable>
          )}
        />
      )}
    </>
  );
}
