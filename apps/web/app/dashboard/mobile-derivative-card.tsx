"use client";

import { CaretDownIcon, CaretRightIcon, ChartLineUpIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Evaluation } from "@/lib/derivativesBoard";
import { signedInr } from "@/lib/payoff-series";
import { cn } from "@/lib/utils";

const rupees = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const money = (n: number | null, unlimited: string) => (n == null ? unlimited : rupees(n));

function Flash({ v, children }: { v: unknown; children: React.ReactNode }) {
  return (
    <span key={String(v)} className="animate-tick-flash rounded-sm motion-reduce:animate-none">
      {children}
    </span>
  );
}

export function MobileDerivativeCard({
  item,
  onAnalyze,
}: {
  item: Evaluation;
  onAnalyze: (symbol: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const nearest = item.payoff.reduce(
    (best, r, i) =>
      Math.abs(Number(r.closing_price) - item.spot) <
      Math.abs(Number(item.payoff[best]?.closing_price ?? 0) - item.spot)
        ? i
        : best,
    0
  );

  return (
    <Card
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-150 shadow-xs",
        item.stale && "opacity-80"
      )}
    >
      {/* Top Header: Symbol, Spot Price & Metadata */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-base tracking-tight">
              {item.symbol}
            </span>
            {item.stale && (
              <Badge
                variant="outline"
                className="h-4.5 rounded px-1.5 text-[10px] text-muted-foreground"
              >
                Stale
              </Badge>
            )}
          </div>
          <span className="num text-xs text-muted-foreground">
            {item.expiry} · Lot {item.lot}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Spot
          </span>
          <span className="num text-base font-semibold text-foreground">
            ₹<Flash v={item.spot}>{item.spot.toLocaleString("en-IN", { minimumFractionDigits: 1 })}</Flash>
          </span>
        </div>
      </div>

      {/* Primary 3-Metric Matrix */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/60 p-2.5">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Max Profit
          </span>
          <span className="num text-sm font-semibold text-profit truncate">
            <Flash v={item.maxProfit}>
              {item.maxProfit == null ? "Unlimited" : `+${rupees(item.maxProfit)}`}
            </Flash>
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Max Loss
          </span>
          <span className="num text-sm font-semibold text-loss truncate">
            <Flash v={item.maxLoss}>
              {item.maxLoss == null ? "Unlimited" : `−${rupees(Math.abs(item.maxLoss))}`}
            </Flash>
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Profit:Risk
          </span>
          <span className="num text-sm font-semibold text-foreground truncate">
            {item.roi == null ? "—" : `${item.roi.toFixed(2)}×`}
          </span>
        </div>
      </div>

      {/* Secondary Details: Investment & Breakeven Distance */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
        <span>
          Investment:{" "}
          <strong className="num text-foreground font-medium">
            <Flash v={item.investment}>{money(item.investment, "—")}</Flash>
          </strong>
        </span>
        <span>
          Breakeven:{" "}
          <strong className="num text-foreground font-medium">
            {item.beDistancePct == null ? "—" : `${item.beDistancePct.toFixed(1)}% away`}
          </strong>
        </span>
      </div>

      {/* Card Actions: Payoff toggle and Direct Analyze */}
      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(!open)}
        >
          {open ? <CaretDownIcon className="size-3.5" /> : <CaretRightIcon className="size-3.5" />}
          {open ? "Hide Payoff" : "Show Payoff Table"}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs font-semibold"
          onClick={() => onAnalyze(item.symbol)}
        >
          <ChartLineUpIcon className="size-3.5" />
          Analyze Strategy
        </Button>
      </div>

      {/* Collapsible Payoff Table for Mobile */}
      {open && item.payoff.length > 0 && (
        <div className="mt-2 overflow-x-auto rounded-lg border border-border bg-background p-2">
          <Table className="text-right text-xs">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-2 text-left text-[11px]">Closing</TableHead>
                <TableHead className="px-2 text-right text-[11px]">Net P&amp;L/Lot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.payoff.map((r, i) => {
                const net = Number(r.net_pl) * item.lot;
                return (
                  <TableRow
                    key={String(r.closing_price)}
                    className={cn(
                      "num h-7 text-xs",
                      i === nearest && "bg-accent/80 font-medium"
                    )}
                  >
                    <TableCell className="px-2 py-1 text-left">
                      {Number(r.closing_price).toLocaleString("en-IN")}
                      {i === nearest && (
                        <Badge variant="outline" className="ml-1.5 h-4 px-1 text-[9px]">
                          ATM
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "num px-2 py-1 font-medium",
                        net >= 0 ? "text-profit" : "text-loss"
                      )}
                    >
                      {signedInr(net)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
