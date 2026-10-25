import { StarIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Sparkline } from "@/app/components/sparkline";
import { ViewBadge } from "@/app/components/view-badge";
import { signedInr } from "@/lib/payoff-series";
import { cn } from "@/lib/utils";
import { payoffPoints } from "./payoff-points";
import { inr, type NormalizedStrategy } from "./types";

export type RankedEntry = {
  score: number;
  viable: boolean;
  rank: number;
  metrics?: {
    pop?: number;
    ev_per_lot?: number;
    reward_risk?: number | null;
  } | null;
};

export const STRATEGY_COLUMNS = [
  { label: "#" },
  { label: "Strategy" },
  { label: "View" },
  { label: "Net debit or credit", numeric: true },
  { label: "Max profit", numeric: true },
  { label: "Max loss", numeric: true },
  { label: "Breakeven", numeric: true },
  { label: "ROI", numeric: true },
  { label: "Score", numeric: true },
  { label: "Payoff shape" },
] as const;

export default function StrategyRow({
  strategy,
  index,
  selected,
  decision,
  recommended,
  onSelect,
}: {
  strategy: NormalizedStrategy;
  index: number;
  selected: boolean;
  decision?: RankedEntry;
  recommended?: boolean;
  onSelect: () => void;
}) {
  const { name, legs, category, costOrCredit, maxProfit, maxLoss, breakevens, payoffTable } = strategy;
  const roi =
    decision?.metrics?.reward_risk != null
      ? `${decision.metrics.reward_risk.toFixed(2)}×`
      : typeof maxProfit === "number" && typeof maxLoss === "number" && maxLoss > 0
        ? `${((maxProfit / maxLoss) * 100).toFixed(0)}%`
        : "NA";

  return (
    <TableRow
      tabIndex={0}
      aria-selected={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "h-16 cursor-pointer outline-none focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
        selected && "bg-accent hover:bg-accent",
      )}
    >
      <TableCell className={cn("num relative px-3 text-sm text-muted-foreground", selected && "text-foreground")}>
        {selected && <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />}
        {String(decision?.rank ?? index + 1).padStart(2, "0")}
      </TableCell>
      <TableCell className="px-3">
        <div className="flex flex-col">
          <span className="flex items-center gap-2 text-sm font-medium">
            {name}
            {recommended && (
              <Badge className="h-5 rounded px-2">
                <StarIcon weight="fill" aria-hidden />
                Recommended
              </Badge>
            )}
          </span>
          <span className="num text-xs text-muted-foreground">{legs.map((l) => l.strike.toLocaleString("en-IN")).join(" / ")}</span>
        </div>
      </TableCell>
      <TableCell className="px-3">
        <ViewBadge view={category} />
      </TableCell>
      <TableCell className="num px-3 text-right text-sm">
        <span className="mr-2 font-sans text-xs text-muted-foreground">{costOrCredit.label}</span>
        {inr(costOrCredit.amount)}
      </TableCell>
      <TableCell className="num px-3 text-right text-sm text-profit">
        {typeof maxProfit === "number" ? signedInr(maxProfit, 2) : (maxProfit ?? "—")}
      </TableCell>
      <TableCell className="num px-3 text-right text-sm text-loss">
        {typeof maxLoss === "number" ? signedInr(-Math.abs(maxLoss), 2) : (maxLoss ?? "—")}
      </TableCell>
      <TableCell className="num px-3 text-right text-sm">
        <div className="flex flex-col items-end">
          {breakevens.length ? breakevens.map((b) => <span key={b}>{b.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>) : "—"}
        </div>
      </TableCell>
      <TableCell className="num px-3 text-right text-sm">{roi}</TableCell>
      <TableCell className="num px-3 text-right text-sm">
        {decision ? (
          <div className="flex flex-col items-end">
            <span>{decision.score.toFixed(0)}</span>
            <span className="font-sans text-xs text-muted-foreground">{decision.viable ? "Viable" : "Not viable"}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="px-3">
        <Sparkline points={payoffPoints(payoffTable)} width={88} height={32} />
      </TableCell>
    </TableRow>
  );
}
