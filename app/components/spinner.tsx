import { CircleNotchIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <CircleNotchIcon aria-hidden className={cn("animate-spin motion-reduce:animate-none", className)} />;
}
