import { View } from "react-native";
import { Text } from "@/components/ui";
import { BrandMark } from "./BrandMark";

/** Mark and name side by side, as in the onboarding header. */
export function Brand({ markSize = 24 }: { markSize?: number }) {
  return (
    <View className="flex-row items-center gap-2">
      <BrandMark size={markSize} />
      <Text weight="semibold">OptionPilot</Text>
    </View>
  );
}
