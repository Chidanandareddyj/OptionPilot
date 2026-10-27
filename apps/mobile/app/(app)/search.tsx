import { useRouter } from "expo-router";
import { useMemo } from "react";
import { View } from "react-native";
import { filterSymbols } from "@optionpilot/shared";
import { SearchInput } from "@/components/search/SearchInput";
import { SymbolList } from "@/components/search/SymbolList";
import { TextLink } from "@/components/ui";
import { useAnalyzeFlow } from "@/lib/analysis/AnalyzeFlow";
import { useOnline } from "@/lib/api/online";

/** Presented as a form sheet over the Terminal (see the options in (app)/_layout.tsx). */
export default function SearchSheet() {
  const router = useRouter();
  const { query, setQuery, start } = useAnalyzeFlow();
  const online = useOnline();
  const results = useMemo(() => filterSymbols(query), [query]);

  const analyze = (symbol: string) => {
    const wanted = symbol.trim().toUpperCase();
    if (!wanted) return;
    setQuery(wanted);
    if (!online) {
      router.back();
      return;
    }
    if (start(wanted)) router.replace("/analysis/new");
  };

  // Return picks the highlighted match, or the typed symbol when nothing in the list matches.
  const submit = () => analyze(query.trim() && results.length > 0 ? results[0].symbol : query);

  return (
    <View className="flex-1 bg-card px-4 pt-6">
      <View className="flex-row items-center gap-2">
        <SearchInput value={query} onChangeText={setQuery} onSubmit={submit} />
        <View className="px-2">
          <TextLink label="Cancel" size="base" onPress={() => router.back()} />
        </View>
      </View>
      <SymbolList query={query} results={results} onSelect={analyze} />
    </View>
  );
}
