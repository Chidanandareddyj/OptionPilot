import { View } from "react-native";

/** Pager dots: the current page is a 24 px pill, the others 8 px dots. */
export function PageDots({ count, active }: { count: number; active: number }) {
  return (
    <View
      className="flex-row items-center justify-center gap-2"
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${active + 1} of ${count}`}
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          className={index === active ? "h-2 w-6 rounded-full bg-primary" : "h-2 w-2 rounded-full bg-border"}
        />
      ))}
    </View>
  );
}
