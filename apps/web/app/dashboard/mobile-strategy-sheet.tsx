"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import StrategyDetail from "./strategy-detail";
import type { NormalizedStrategy } from "@optionpilot/shared";

export function MobileStrategySheet({
  strategy,
  open,
  onOpenChange,
}: {
  strategy: NormalizedStrategy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!strategy) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-2xl p-0 focus:outline-none"
      >
        {/* Grab Handle */}
        <div className="sticky top-0 z-20 flex w-full justify-center bg-popover pt-3 pb-2">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/20" />
        </div>

        <SheetHeader className="px-4 pb-2 text-left">
          <SheetTitle className="sr-only">{strategy.name} Details</SheetTitle>
          <SheetDescription className="sr-only">
            Payoff chart, key risk metrics, and legs breakdown.
          </SheetDescription>
        </SheetHeader>

        <div className="px-3 pb-8">
          <StrategyDetail strategy={strategy} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
