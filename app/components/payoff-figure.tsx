"use client";

import { PayoffChart } from "./payoff-chart";

// A schematic bull call spread in abstract units: no real prices, only the shape.
const LOWER = 40;
const UPPER = 60;
const DEBIT = 8;
const POINTS = Array.from({ length: 21 }, (_, i) => {
  const price = i * 5;
  return { price, pnl: Math.min(Math.max(price - LOWER, 0), UPPER - LOWER) - DEBIT };
});

export function PayoffFigure({ height = 360, className }: { height?: number; className?: string }) {
  return (
    <PayoffChart
      illustrative
      points={POINTS}
      spot={50}
      breakevens={[LOWER + DEBIT]}
      strikes={[
        { price: LOWER, label: "Buy lower call" },
        { price: UPPER, label: "Sell higher call" },
      ]}
      height={height}
      className={className}
    />
  );
}
