import { CoinsIcon, EqualsIcon, TrendDownIcon, TrendUpIcon, WaveSineIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Category } from "@/app/dashboard/types";

export type MarketView = Category | "income";

const VIEWS: Record<MarketView, { label: string; Icon: typeof TrendUpIcon }> = {
  bullish: { label: "Bullish", Icon: TrendUpIcon },
  bearish: { label: "Bearish", Icon: TrendDownIcon },
  neutral: { label: "Neutral", Icon: EqualsIcon },
  volatile: { label: "Volatile", Icon: WaveSineIcon },
  income: { label: "Income", Icon: CoinsIcon },
};

/** Market view as icon plus word, so it reads without colour. */
export function ViewBadge({ view, className }: { view: MarketView; className?: string }) {
  const { label, Icon } = VIEWS[view];
  return (
    <Badge variant="secondary" className={cn("h-6 rounded-md bg-accent px-2 font-normal text-muted-foreground", className)}>
      <Icon aria-hidden />
      {label}
    </Badge>
  );
}
