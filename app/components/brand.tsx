import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-6 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground", className)}>
      <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 12 L6 12 L10 4 L14 4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** Logo plus wordmark. `compact` hides the wordmark visually on small screens. */
export function Brand({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 text-base font-semibold text-foreground", className)}>
      <Logo />
      <span className={cn(compact && "max-sm:sr-only")}>OptionPilot</span>
    </span>
  );
}
