import type { Category } from "@optionpilot/shared";
import { EqualsIcon, TrendDownIcon, TrendUpIcon, WaveSineIcon, type PhosphorIcon } from "@/components/icons";
import { Tag } from "@/components/ui";
import { VIEW_LABEL } from "@/lib/analysis/model";

export const VIEW_ICON: Record<Category, PhosphorIcon> = {
  bullish: TrendUpIcon,
  bearish: TrendDownIcon,
  neutral: EqualsIcon,
  volatile: WaveSineIcon,
};

/** "Bullish" and the like, with its trend icon. */
export function ViewTag({ view }: { view: Category }) {
  return <Tag icon={VIEW_ICON[view]} label={VIEW_LABEL[view]} />;
}
