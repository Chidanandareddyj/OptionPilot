"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PayoffChart } from "@/app/components/payoff-chart";
import { ViewBadge } from "@/app/components/view-badge";
import { signedInr } from "@/lib/payoff-series";
import { cn } from "@/lib/utils";
import { payoffPoints, strikeMarkers } from "./payoff-points";
import { inr, keyMetrics, type NormalizedStrategy } from "./types";

const STAT_TIPS: Record<string, string> = {
  Spot: "Last traded price of the underlying",
  "Max profit": "Best case at expiry for the position",
  "Max loss": "Worst case at expiry for the position",
  Breakeven: "Price at expiry where P&L is zero",
  Breakevens: "Prices at expiry where P&L is zero",
  "Risk : reward": "Max loss against max profit",
};

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const tip = STAT_TIPS[label.replace(/ \(.*\)$/, "")] ?? "Premium paid or received for the whole position";
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <dt tabIndex={0} className="w-fit cursor-help text-sm text-muted-foreground outline-none focus-visible:underline">
            {label}
          </dt>
        </TooltipTrigger>
        <TooltipContent>{tip}</TooltipContent>
      </Tooltip>
      <dd className={cn("num truncate text-xl font-medium", tone)}>{value}</dd>
    </div>
  );
}

const pnlTone = (v: number) => (v > 0 ? "text-profit" : v < 0 ? "text-loss" : "text-foreground");

export default function StrategyDetail({ strategy }: { strategy: NormalizedStrategy }) {
  const [tab, setTab] = useState("payoff");
  const { name, category, description, spotPrice, lotSize, legs, maxProfit, maxLoss, breakevens, payoffTable, costOrCredit } = strategy;

  const points = payoffPoints(payoffTable);
  const legColumns = Object.keys(payoffTable[0] ?? {}).filter((k) => k !== "closing_price" && k !== "net_pl");
  const atmIndex = payoffTable.reduce(
    (best, row, i) =>
      Math.abs(row.closing_price - spotPrice) < Math.abs(payoffTable[best].closing_price - spotPrice) ? i : best,
    0,
  );
  const metrics = [
    { label: "Spot", value: inr(spotPrice), tone: "text-foreground" },
    ...keyMetrics(strategy),
    {
      label: "Risk : reward",
      value: typeof maxProfit === "number" && typeof maxLoss === "number" && maxLoss > 0 ? `1 : ${(maxProfit / maxLoss).toFixed(2)}` : "Uncapped",
      tone: "text-foreground",
    },
  ];

  return (
    <Card className="@container gap-4 p-6">
      <div className="flex flex-col gap-2 @3xl:flex-row @3xl:items-start @3xl:gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-3xl font-semibold tracking-tight">{name}</h2>
          <ViewBadge view={category} />
        </div>
        <p className="max-w-md text-sm text-muted-foreground @3xl:ml-auto @3xl:text-right">{description}</p>
      </div>

      <dl className="grid grid-cols-2 gap-4 @xl:grid-cols-3 @5xl:grid-cols-6">
        {metrics.map((m) => (
          <Stat key={m.label} {...m} />
        ))}
      </dl>

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <TabsList className="h-10 p-1">
            <TabsTrigger value="payoff" className="px-3">
              Payoff
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2 px-3">
              Payoff table <span className="num text-xs text-muted-foreground">{payoffTable.length}</span>
            </TabsTrigger>
            <TabsTrigger value="legs" className="gap-2 px-3">
              Legs <span className="num text-xs text-muted-foreground">{legs.length}</span>
            </TabsTrigger>
          </TabsList>
          <span className="text-sm text-muted-foreground @3xl:ml-auto">
            Expiry P&amp;L for one lot{lotSize > 1 && <> of <span className="num">{lotSize.toLocaleString("en-IN")}</span></>}. Hover the chart to read any price.
          </span>
        </div>

        <TabsContent value="payoff" className="rounded-xl bg-background p-4">
          {points.length > 1 ? (
            <PayoffChart
              points={points}
              spot={spotPrice}
              breakevens={breakevens}
              strikes={strikeMarkers(legs)}
              maxProfit={maxProfit}
              maxLoss={maxLoss}
            />
          ) : (
            <Empty className="h-72">
              <EmptyHeader>
                <EmptyTitle>No payoff data</EmptyTitle>
                <EmptyDescription>The calculator returned no payoff table for this strategy.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsContent>

        <TabsContent value="table" className="rounded-xl bg-background p-2">
          <div className="max-h-[480px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="px-4 py-3 text-sm">Price at expiry</TableHead>
                  {legColumns.map((k) => (
                    <TableHead key={k} className="px-4 py-3 text-right text-sm capitalize">
                      {k.replace(/_/g, " ")}
                    </TableHead>
                  ))}
                  <TableHead className="px-4 py-3 text-right text-sm">Net P&amp;L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoffTable.map((row, i) => (
                  <TableRow key={row.closing_price} className={cn("h-8", i === atmIndex && "bg-accent hover:bg-accent")}>
                    <TableCell className="num px-4 py-1 text-sm">
                      {row.closing_price.toLocaleString("en-IN")}
                      {i === atmIndex && <Badge className="ml-3 h-5 rounded px-2 text-xs">Spot</Badge>}
                    </TableCell>
                    {legColumns.map((k) => (
                      <TableCell key={k} className="num px-4 py-1 text-right text-sm text-muted-foreground">
                        {signedInr(row[k], 2)}
                      </TableCell>
                    ))}
                    <TableCell className={cn("num px-4 py-1 text-right text-sm", pnlTone(row.net_pl))}>{signedInr(row.net_pl, 2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="legs" className="rounded-xl bg-background p-2">
          <Table>
            <TableHeader>
              <TableRow>
                {["Leg", "Action", "Strike", "Premium", "Instrument"].map((h, i) => (
                  <TableHead key={h} className={cn("px-4 py-3 text-sm", i === 3 && "text-right")}>
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {legs.map((leg) => (
                <TableRow key={leg.label} className="h-12">
                  <TableCell className="px-4 text-sm capitalize">{leg.label}</TableCell>
                  <TableCell className="px-4">
                    <Badge variant="outline" className="h-6 rounded-md px-2 text-xs">
                      {leg.action}
                      {leg.qty > 1 && <span className="num">×{leg.qty}</span>}
                    </Badge>
                  </TableCell>
                  <TableCell className="num px-4 text-sm">
                    {leg.strike.toLocaleString("en-IN")} {leg.type === "call" ? "CE" : "PE"}
                  </TableCell>
                  <TableCell className="num px-4 text-right text-sm">{leg.premium === undefined ? "—" : inr(leg.premium)}</TableCell>
                  <TableCell className="num px-4 text-xs text-muted-foreground">{leg.instrumentKey ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="bg-accent/60">
              <TableRow className="h-12">
                <TableCell colSpan={3} className="px-4 text-sm font-medium">
                  {costOrCredit.label}
                  {lotSize > 1 && <span className="font-normal text-muted-foreground"> for one lot</span>}
                </TableCell>
                <TableCell className="num px-4 text-right text-sm font-medium">{inr(costOrCredit.amount)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
