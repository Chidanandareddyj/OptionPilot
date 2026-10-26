"use client";

import { CaretRightIcon, SparkleIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ViewBadge } from "@/app/components/view-badge";
import { cn } from "@/lib/utils";
import { inr, type NormalizedStrategy } from "@optionpilot/shared";

type DecisionRow = {
  rank?: number;
  score?: number;
  stars?: number;
  explanation?: string;
};

export function MobileStrategyCard({
  strategy,
  selected,
  decision,
  recommended,
  onSelect,
}: {
  strategy: NormalizedStrategy;
  selected?: boolean;
  decision?: DecisionRow;
  recommended?: boolean;
  onSelect: () => void;
}) {
  const { name, category, tagline, maxProfit, maxLoss, costOrCredit } = strategy;

  const profitDisplay = typeof maxProfit === "number" ? inr(maxProfit) : (maxProfit ?? "—");
  const lossDisplay = typeof maxLoss === "number" ? inr(maxLoss) : (maxLoss ?? "—");

  const riskReward =
    typeof maxProfit === "number" && typeof maxLoss === "number" && maxLoss > 0
      ? `1 : ${(maxProfit / maxLoss).toFixed(2)}`
      : maxProfit === "Unlimited"
        ? "Uncapped"
        : "—";

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-3 rounded-xl border p-4 text-left transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected
          ? "border-primary/80 bg-accent/30 ring-1 ring-primary/60 shadow-xs"
          : "border-border bg-card hover:border-foreground/20 hover:bg-accent/15"
      )}
    >
      {/* Top Header: Title, Category Badge & AI Recommendation Rank */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground tracking-tight text-base group-hover:text-primary transition-colors">
              {name}
            </span>
            <ViewBadge view={category} />
          </div>
          <span className="text-xs text-muted-foreground line-clamp-1">
            {tagline}
          </span>
        </div>

        {/* AI Score / Recommended Pill */}
        {recommended ? (
          <Badge className="shrink-0 gap-1 bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5">
            <SparkleIcon className="size-3" weight="fill" />
            #1 Pick
          </Badge>
        ) : decision?.rank ? (
          <Badge variant="outline" className="num shrink-0 text-xs text-muted-foreground">
            Rank #{decision.rank}
          </Badge>
        ) : null}
      </div>

      {/* Metrics Row (High Data-Ink Ratio, Accessible Colors) */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/60 p-2.5">
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Max Profit
          </span>
          <span className="num text-sm font-semibold text-profit truncate">
            {profitDisplay}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Max Loss
          </span>
          <span className="num text-sm font-semibold text-loss truncate">
            {lossDisplay}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Risk:Reward
          </span>
          <span className="num text-sm font-semibold text-foreground truncate">
            {riskReward}
          </span>
        </div>
      </div>

      {/* Footer info: Outlay & Tap Hint */}
      <div className="flex items-center justify-between pt-0.5 text-xs text-muted-foreground">
        <span className="truncate">
          {costOrCredit.label}:{" "}
          <strong className="num font-medium text-foreground">
            {inr(costOrCredit.amount)}
          </strong>
        </span>
        <div className="flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform text-xs font-medium">
          <span>Payoff &amp; Legs</span>
          <CaretRightIcon className="size-3" />
        </div>
      </div>
    </Card>
  );
}
