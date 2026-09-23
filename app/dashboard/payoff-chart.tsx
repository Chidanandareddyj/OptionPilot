"use client";

import { useMemo, useState } from "react";
import type { PayoffRow } from "./types";

interface PayoffChartProps {
  payoffTable: PayoffRow[];
  spotPrice: number;
  breakevens?: number[];
  height?: number;
}

export default function PayoffChart({
  payoffTable,
  spotPrice,
  breakevens = [],
  height = 250,
}: PayoffChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { points, minX, maxX, minY, maxY, zeroY, spotX, width, chartHeight, padding } =
    useMemo(() => {
      const width = 740;
      const chartHeight = height;
      const padding = { top: 20, right: 28, bottom: 32, left: 52 };

      if (!payoffTable || payoffTable.length === 0) {
        return {
          points: [],
          minX: 0,
          maxX: 1,
          minY: -10,
          maxY: 10,
          zeroY: chartHeight / 2,
          spotX: width / 2,
          width,
          chartHeight,
          padding,
        };
      }

      const xValues = payoffTable.map((p) => p.closing_price);
      const yValues = payoffTable.map((p) => p.net_pl);

      const rawMinX = Math.min(...xValues);
      const rawMaxX = Math.max(...xValues);
      const rawMinY = Math.min(...yValues);
      const rawMaxY = Math.max(...yValues);

      const effectiveMinY = Math.min(rawMinY, 0) - Math.abs(rawMaxY - rawMinY || 10) * 0.12;
      const effectiveMaxY = Math.max(rawMaxY, 0) + Math.abs(rawMaxY - rawMinY || 10) * 0.12;

      const innerWidth = width - padding.left - padding.right;
      const innerHeight = chartHeight - padding.top - padding.bottom;

      const scaleX = (x: number) => {
        if (rawMaxX === rawMinX) return padding.left + innerWidth / 2;
        return padding.left + ((x - rawMinX) / (rawMaxX - rawMinX)) * innerWidth;
      };

      const scaleY = (y: number) => {
        if (effectiveMaxY === effectiveMinY) return padding.top + innerHeight / 2;
        return (
          padding.top +
          (1 - (y - effectiveMinY) / (effectiveMaxY - effectiveMinY)) * innerHeight
        );
      };

      const mappedPoints = payoffTable.map((row, idx) => ({
        index: idx,
        x: scaleX(row.closing_price),
        y: scaleY(row.net_pl),
        price: row.closing_price,
        netPl: row.net_pl,
        raw: row,
      }));

      const zeroY = scaleY(0);
      const spotX = scaleX(spotPrice);

      return {
        points: mappedPoints,
        minX: rawMinX,
        maxX: rawMaxX,
        minY: effectiveMinY,
        maxY: effectiveMaxY,
        zeroY,
        spotX,
        width,
        chartHeight,
        padding,
      };
    }, [payoffTable, spotPrice, height]);

  if (points.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-xs font-mono text-white/40">
        NO PAYOFF DATA
      </div>
    );
  }

  const linePath = points.reduce((acc, curr, idx) => {
    return `${acc} ${idx === 0 ? "M" : "L"} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`;
  }, "");

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)},${zeroY.toFixed(1)} L ${points[0].x.toFixed(1)},${zeroY.toFixed(1)} Z`;

  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

  const yTicks = [
    maxY,
    maxY * 0.5,
    0,
    minY * 0.5,
    minY,
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const xTicks = [
    points[0],
    points[Math.floor(points.length * 0.25)],
    points[Math.floor(points.length * 0.5)],
    points[Math.floor(points.length * 0.75)],
    points[points.length - 1],
  ].filter(Boolean);

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

    let closestIdx = 0;
    let minDistance = Infinity;
    points.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - mouseX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[#031536] p-4">
      {/* Top Status & Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-3 text-xs">
        <div className="flex items-center gap-4 text-[11px] font-mono uppercase tracking-wider">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Profit Zone</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            <span>Loss Zone</span>
          </div>
          <div className="flex items-center gap-1.5 text-sky-400">
            <span className="h-0.5 w-2.5 bg-sky-400" />
            <span>Spot ({spotPrice.toFixed(1)})</span>
          </div>
        </div>

        {hoveredPoint ? (
          <div className="flex items-center gap-3 font-mono text-[12px] tabular-nums">
            <span className="text-white/60">
              Strike: <strong className="text-white">₹{hoveredPoint.price.toLocaleString("en-IN")}</strong>
            </span>
            <span
              className={`rounded px-1.5 py-0.5 font-medium ${
                hoveredPoint.netPl >= 0
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                  : "bg-rose-500/15 text-rose-300 border border-rose-500/25"
              }`}
            >
              P&L: {hoveredPoint.netPl >= 0 ? "+" : ""}
              ₹{hoveredPoint.netPl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        ) : (
          <span className="font-mono text-[11px] text-white/40">
            Hover to inspect strike P&L
          </span>
        )}
      </div>

      {/* SVG Chart */}
      <div className="relative w-full pt-2">
        <svg
          viewBox={`0 0 ${width} ${chartHeight}`}
          className="w-full cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Subtle area fill */}
          <path d={areaPath} fill="rgba(56, 189, 248, 0.05)" />

          {/* Grid lines */}
          {yTicks.map((tickVal, i) => {
            const innerHeight = chartHeight - padding.top - padding.bottom;
            const y =
              padding.top +
              (1 - (tickVal - minY) / (maxY - minY || 1)) * innerHeight;
            return (
              <g key={`ytick-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="2 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-white/35 font-mono text-[10px] tabular-nums"
                >
                  {tickVal > 0 ? `+${Math.round(tickVal)}` : Math.round(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Zero reference line */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="rgba(255, 255, 255, 0.28)"
            strokeWidth="1"
          />

          {/* Payoff line */}
          <path
            d={linePath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Spot price vertical line */}
          {spotX >= padding.left && spotX <= width - padding.right && (
            <g>
              <line
                x1={spotX}
                y1={padding.top}
                x2={spotX}
                y2={chartHeight - padding.bottom}
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <text
                x={spotX}
                y={padding.top - 5}
                textAnchor="middle"
                className="fill-sky-300 font-mono text-[9px] font-bold tracking-wider"
              >
                SPOT
              </text>
            </g>
          )}

          {/* Breakeven indicators */}
          {breakevens.map((be, idx) => {
            if (be < minX || be > maxX) return null;
            const innerWidth = width - padding.left - padding.right;
            const beX = padding.left + ((be - minX) / (maxX - minX || 1)) * innerWidth;
            return (
              <g key={`be-${idx}`}>
                <circle cx={beX} cy={zeroY} r="3" fill="#fbbf24" />
                <text
                  x={beX}
                  y={zeroY + 13}
                  textAnchor="middle"
                  className="fill-amber-300 font-mono text-[9px] tabular-nums font-medium"
                >
                  BE {be}
                </text>
              </g>
            );
          })}

          {/* X axis strike labels */}
          {xTicks.map((pt, idx) => (
            <text
              key={`xtick-${idx}`}
              x={pt.x}
              y={chartHeight - padding.bottom + 16}
              textAnchor="middle"
              className="fill-white/40 font-mono text-[10px] tabular-nums"
            >
              ₹{pt.price}
            </text>
          ))}

          {/* Crosshair indicator */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={chartHeight - padding.bottom}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="4"
                fill={hoveredPoint.netPl >= 0 ? "#10b981" : "#f43f5e"}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
