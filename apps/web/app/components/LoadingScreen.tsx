import { cn } from "@/lib/utils";
import { BrandMark } from "./brand";

export interface LoadingScreenProps {
  statusText?: string;
  className?: string;
}

export default function LoadingScreen({ statusText = "Loading OptionPilot...", className }: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-background/95 select-none", className)}
    >
      <BrandMark className="size-12" />
      <div className="flex flex-col items-center gap-2">
        <span className="text-base font-semibold text-foreground">OptionPilot</span>
        <span className="text-sm text-muted-foreground">{statusText}</span>
      </div>
      <div aria-hidden className="h-1 w-32 overflow-hidden rounded-full bg-accent">
        <div className="h-full w-1/3 animate-[loading-bar_1.1s_ease-in-out_infinite] rounded-full bg-primary motion-reduce:animate-none" />
      </div>
    </div>
  );
}
