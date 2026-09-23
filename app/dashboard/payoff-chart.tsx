"use client";

import { useEffect, useRef, useState } from "react";
import { inr, type PayoffRow } from "./types";

const HEIGHT = 250;
const PAD = { top: 20, right: 16, bottom: 32, left: 48 };

export default function PayoffChart({
  payoffTable,
  spotPrice,
  breakevens,
}: {
  payoffTable: PayoffRow[];
  spotPrice: number;
  breakevens: number[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(740);
  const [hover, setHover] = useState<number | null>(null);

  const empty = payoffTable.length === 0;
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [empty]);

  if (empty) {
    return (
      <div className="flex h-44 items-center justify-center rounded-lg border border-white/10 font-mono text-xs text-white/40">
        NO PAYOFF DATA
      </div>
    );
  }

  const xs = payoffTable.map((r) => r.closing_price);
  const ys = payoffTable.map((r) => r.net_pl);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const pad = (Math.max(...ys) - Math.min(...ys) || 10) * 0.12;
  const minY = Math.min(...ys, 0) - pad;
  const maxY = Math.max(...ys, 0) + pad;

  const scaleX = (x: number) => PAD.left + ((x - minX) / (maxX - minX || 1)) * (width - PAD.left - PAD.right);
  const scaleY = (y: number) => PAD.top + (1 - (y - minY) / (maxY - minY)) * (HEIGHT - PAD.top - PAD.bottom);

  const points = payoffTable.map((r) => ({ x: scaleX(r.closing_price), y: scaleY(r.net_pl), price: r.closing_price, pl: r.net_pl }));
  const line = points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const zeroY = scaleY(0);
  const spotX = scaleX(spotPrice);
  const hovered = hover === null ? null : points[hover];
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => points[Math.round(f * (points.length - 1))]);
  const yTicks = [...new Set([maxY, maxY / 2, 0, minY / 2, minY])];

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    let closest = 0;
    points.forEach((p, i) => {
      if (Math.abs(p.x - x) < Math.abs(points[closest].x - x)) closest = i;
    });
    setHover(closest);
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[#031536] p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-white/10 pb-3 font-mono text-[11px] uppercase tracking-wider">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-emerald-400">● Profit</span>
          <span className="text-rose-400">● Loss</span>
          <span className="text-sky-400">┆ Spot {spotPrice.toFixed(1)}</span>
        </div>
        {hovered ? (
          <span className="normal-case tabular-nums text-white/60">
            ₹{hovered.price.toLocaleString("en-IN")} →{" "}
            <span className={hovered.pl >= 0 ? "text-emerald-300" : "text-rose-300"}>
              {hovered.pl >= 0 ? "+" : ""}
              {inr(hovered.pl)}
            </span>
          </span>
        ) : (
          <span className="normal-case text-white/40">Hover or tap to inspect</span>
        )}
      </div>

      <div ref={ref} className="overflow-hidden pt-2">
        <svg
          width={width}
          height={HEIGHT}
          className="block cursor-crosshair select-none"
          onPointerMove={onPointerMove}
          onPointerDown={onPointerMove}
          onPointerLeave={() => setHover(null)}
        >
          <path d={`${line} L${points.at(-1)!.x},${zeroY} L${points[0].x},${zeroY} Z`} fill="rgba(56,189,248,0.05)" />

          {yTicks.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={width - PAD.right} y1={scaleY(v)} y2={scaleY(v)} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 3" />
              <text x={PAD.left - 6} y={scaleY(v) + 3} textAnchor="end" className="fill-white/35 font-mono text-[10px]">
                {v > 0 ? "+" : ""}
                {Math.round(v)}
              </text>
            </g>
          ))}

          <line x1={PAD.left} x2={width - PAD.right} y1={zeroY} y2={zeroY} stroke="rgba(255,255,255,0.28)" />
          <path d={line} fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinejoin="round" />

          {spotPrice >= minX && spotPrice <= maxX && (
            <line x1={spotX} x2={spotX} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 3" />
          )}

          {breakevens
            .filter((be) => be >= minX && be <= maxX)
            .map((be) => (
              <g key={be}>
                <circle cx={scaleX(be)} cy={zeroY} r="3" fill="#fbbf24" />
                <text x={scaleX(be)} y={zeroY + 13} textAnchor="middle" className="fill-amber-300 font-mono text-[9px]">
                  BE {be}
                </text>
              </g>
            ))}

          {xTicks.map((p, i) => (
            <text key={i} x={p.x} y={HEIGHT - PAD.bottom + 16} textAnchor="middle" className="fill-white/40 font-mono text-[10px]">
              {p.price}
            </text>
          ))}

          {hovered && (
            <g>
              <line x1={hovered.x} x2={hovered.x} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="rgba(255,255,255,0.4)" strokeDasharray="2 2" />
              <circle cx={hovered.x} cy={hovered.y} r="4" fill={hovered.pl >= 0 ? "#10b981" : "#f43f5e"} stroke="#fff" strokeWidth="1.5" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
