"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "_");
  const profitClipId = `profitClip_${uid}`;
  const lossClipId = `lossClip_${uid}`;
  const profitGradId = `profitGrad_${uid}`;
  const lossGradId = `lossGrad_${uid}`;

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
    <div className="rounded-xl border border-white/12 bg-white/[0.02] p-3.5 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-white/10 pb-3 font-mono text-[11px] uppercase tracking-wider">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="size-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" /> Profit
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="size-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" /> Loss
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="h-3 w-0.5 border-r-2 border-dashed border-sky-400" /> Spot ₹{spotPrice.toLocaleString("en-IN", { minimumFractionDigits: 1 })}
          </span>
          {breakevens.length > 0 && (
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="size-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" /> Breakeven
            </span>
          )}
        </div>
        {hovered ? (
          <span className="font-mono text-xs tabular-nums text-white/80">
            ₹{hovered.price.toLocaleString("en-IN")} →{" "}
            <span className={`font-semibold ${hovered.pl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {hovered.pl >= 0 ? "+" : ""}
              {inr(hovered.pl)}
            </span>
          </span>
        ) : (
          <span className="font-mono text-[11px] text-white/40 normal-case">Hover or tap to inspect P&amp;L</span>
        )}
      </div>

      <div ref={ref} className="overflow-hidden pt-3">
        <svg
          width={width}
          height={HEIGHT}
          className="block cursor-crosshair select-none"
          onPointerMove={onPointerMove}
          onPointerDown={onPointerMove}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <clipPath id={profitClipId}>
              <rect x="0" y="0" width={width} height={Math.max(0, zeroY)} />
            </clipPath>
            <clipPath id={lossClipId}>
              <rect x="0" y={zeroY} width={width} height={Math.max(0, HEIGHT - zeroY)} />
            </clipPath>
            <linearGradient id={profitGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id={lossGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.28" />
            </linearGradient>
          </defs>

          {/* Area fill gradients for profit (above zero) and loss (below zero) */}
          <path
            d={`${line} L${points.at(-1)!.x},${zeroY} L${points[0].x},${zeroY} Z`}
            clipPath={`url(#${profitClipId})`}
            fill={`url(#${profitGradId})`}
          />
          <path
            d={`${line} L${points.at(-1)!.x},${zeroY} L${points[0].x},${zeroY} Z`}
            clipPath={`url(#${lossClipId})`}
            fill={`url(#${lossGradId})`}
          />

          {/* Horizontal grid ticks */}
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={scaleY(v)}
                y2={scaleY(v)}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="2 3"
              />
              <text x={PAD.left - 6} y={scaleY(v) + 3} textAnchor="end" className="fill-white/35 font-mono tabular-nums text-[10px]">
                {v > 0 ? "+" : ""}
                {Math.round(v)}
              </text>
            </g>
          ))}

          {/* Zero baseline */}
          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={zeroY}
            y2={zeroY}
            stroke="rgba(255,255,255,0.32)"
            strokeWidth="1.2"
          />

          {/* Main Payoff Line */}
          <path
            d={line}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Spot Price Marker Line & Badge */}
          {spotPrice >= minX && spotPrice <= maxX && (
            <g>
              <line
                x1={spotX}
                x2={spotX}
                y1={PAD.top}
                y2={HEIGHT - PAD.bottom}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.9"
              />
              <rect
                x={spotX - 18}
                y={PAD.top - 14}
                width={36}
                height={13}
                rx={3}
                fill="#0a276b"
                stroke="#38bdf8"
                strokeWidth="1"
              />
              <text
                x={spotX}
                y={PAD.top - 4}
                textAnchor="middle"
                className="fill-sky-300 font-mono text-[8.5px] font-bold tracking-wider"
              >
                SPOT
              </text>
            </g>
          )}

          {/* Breakeven dashed lines & points */}
          {breakevens
            .filter((be) => be >= minX && be <= maxX)
            .map((be) => {
              const bx = scaleX(be);
              return (
                <g key={be}>
                  <line
                    x1={bx}
                    x2={bx}
                    y1={PAD.top}
                    y2={HEIGHT - PAD.bottom}
                    stroke="#fbbf24"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    opacity="0.65"
                  />
                  <circle cx={bx} cy={zeroY} r="3.5" fill="#fbbf24" stroke="#020d24" strokeWidth="1.5" />
                  <text
                    x={bx}
                    y={zeroY > HEIGHT - PAD.bottom - 16 ? zeroY - 8 : zeroY + 14}
                    textAnchor="middle"
                    className="fill-amber-300 font-mono text-[9px] font-semibold"
                  >
                    BE ₹{be.toLocaleString("en-IN")}
                  </text>
                </g>
              );
            })}

          {/* X axis labels */}
          {xTicks.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={HEIGHT - PAD.bottom + 16}
              textAnchor="middle"
              className="fill-white/40 font-mono tabular-nums text-[10px]"
            >
              {p.price.toLocaleString("en-IN")}
            </text>
          ))}

          {/* Hover crosshair & dot */}
          {hovered && (
            <g>
              <line
                x1={hovered.x}
                x2={hovered.x}
                y1={PAD.top}
                y2={HEIGHT - PAD.bottom}
                stroke="rgba(255,255,255,0.45)"
                strokeDasharray="2 2"
              />
              <circle
                cx={hovered.x}
                cy={hovered.y}
                r="4.5"
                fill={hovered.pl >= 0 ? "#10b981" : "#f43f5e"}
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
