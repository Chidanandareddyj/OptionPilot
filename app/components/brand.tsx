import { cn } from "@/lib/utils";
import { OptionPilotLogo } from "./OptionPilotLogo";

/**
 * The owner's brand mark in the variant meant for the active palette: "original" (navy ring) on Paper,
 * "adaptive" (ring in the text colour) on Saffron. Both render so the swap is pure CSS and SSR-safe.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <>
      <OptionPilotLogo aria-hidden variant="original" className={cn("size-8 shrink-0 dark:hidden", className)} />
      <OptionPilotLogo aria-hidden variant="adaptive" className={cn("hidden size-8 shrink-0 text-foreground dark:block", className)} />
    </>
  );
}

/** Brand mark plus wordmark. `compact` hides the wordmark visually on small screens. */
export function Brand({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 text-base font-semibold text-foreground", className)}>
      <BrandMark />
      <span className={cn(compact && "max-sm:sr-only")}>OptionPilot</span>
    </span>
  );
}
