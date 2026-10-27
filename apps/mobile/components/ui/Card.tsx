import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";

/** Bordered surface used for grouped content. */
export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View className={cn("rounded-2xl border border-border bg-card", className)} {...props} />
  );
}

/** The recessed panel inside a Card, drawn in the page background colour. */
export function Inset({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("rounded-xl bg-background", className)} {...props} />;
}
