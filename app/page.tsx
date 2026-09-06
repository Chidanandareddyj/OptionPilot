"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAV = ["Overview", "Strategies", "Analyze", "Insights", "Pricing", "Access"];
const BADGES = ["NSE", "BSE", "F&O"];

/* ---------- dotted mountain + line chart (deterministic, so SSR === client) ---------- */
// viewBox units: 1000 wide == viewport width, so at 16:10 the viewport is ~625 units tall.
const W = 1000;
const H = 330;
const VH = 625;
const STEP = 11;
const PEAK = 0.44 * VH; // lift the dotted mountain toward the hero midpoint

const sig = (x: number) => 1 / (1 + Math.exp(-x));
const g = (t: number, c: number, s: number, a: number) => a * Math.exp(-((t - c) ** 2) / (2 * s * s));

// Ridge height (0..1) across the width: one broad peak with layered foothills.
function ridge(t: number) {
  return Math.min(
    1,
    g(t, 0.72, 0.09, 1) +
      g(t, 0.55, 0.055, 0.22) +
      g(t, 0.3, 0.11, 0.16) +
      g(t, 0.47, 0.012, 0.12) +
      g(t, 0.42, 0.008, 0.06) +
      g(t, 0.38, 0.006, 0.03) +
      0.18 * sig((t - 0.86) * 40) +
      g(t, 0.96, 0.04, 0.12) +
      0.008 * Math.sin(t * 80) * sig((t - 0.3) * 18),
  );
}

// Both price lines use the mountain contour as their trend, then add a small offset.
const bright = (t: number) => 0.08 + ridge(t) * 0.38;
const faint = (t: number) => 0.05 + ridge(t) * 0.3;

// mulberry32: tiny seeded PRNG so the "random" walk is identical on server and client.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DOTS: [number, number][] = [];
for (let x = STEP / 2; x < W; x += STEP) {
  const h = ridge(x / W) * PEAK;
  for (let y = H - STEP / 2; y > H - h; y -= STEP) DOTS.push([x, y]);
}

function walk(seed: number, curve: (t: number) => number, amp: number, from: number) {
  const r = rng(seed);
  const pts: string[] = [];
  let noise = 0;
  for (let x = from; x <= W; x += 6) {
    // A shorter memory and larger steps give the plotted lines a price-chart feel.
    noise = noise * 0.58 + (r() - 0.5) * amp;
    pts.push(`${x},${(H - curve(x / W) * VH + noise).toFixed(1)}`);
  }
  return pts.join(" ");
}
const LINE = walk(7, bright, 7, 0.18 * W);
const FAINT = walk(21, faint, 9, 0);
const LABEL_X = 0.61 * W;
const LABEL_Y = +(H - bright(0.61) * VH).toFixed(1);

/* ---------- dotted wireframe sphere glyph: latitude rings of dots, tilted toward the viewer ---------- */
const SPHERE: [number, number, number][] = [];
for (let lat = -75; lat <= 75; lat += 15) {
  const r = 40 * Math.cos((lat * Math.PI) / 180);
  const cy = 40 * Math.sin((lat * Math.PI) / 180);
  const n = Math.max(6, Math.round(r / 3.2));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    // front half of each ring renders brighter/larger than the back half.
    // Rounded so Node and browser Math.* can't disagree in the last digit and break hydration.
    SPHERE.push([+(r * Math.cos(a)).toFixed(2), +(cy + r * 0.28 * Math.sin(a)).toFixed(2), Math.sin(a) > 0 ? 1.4 : 0.8]);
  }
}

function Clock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const hm = time ? time.slice(0, 5) : "--:--";
  const s = time ? time.slice(5) : ":--";
  return (
    <span className="font-serif text-[17px] tracking-wide">
      NSE {hm}
      <span className="text-white/45">{s}</span>
    </span>
  );
}

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 2 22 12 12 22 2 12Z" />
      <path d="M12 7v10M7 12h10" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="sky relative min-h-screen overflow-hidden text-white select-none">
      {/* clouds */}
      <div className="cloud" style={{ top: "3%", right: "-6%", width: "50vw", height: "14vh", opacity: 0.7, transform: "rotate(-7deg)", filter: "blur(18px)" }} />
      <div className="cloud" style={{ top: "15%", right: "8%", width: "34vw", height: "6vh", opacity: 0.5, transform: "rotate(-5deg)", filter: "blur(14px)" }} />
      <div className="cloud" style={{ top: "22%", right: "-4%", width: "26vw", height: "5vh", opacity: 0.4, transform: "rotate(-4deg)", filter: "blur(14px)" }} />
      <div className="cloud" style={{ bottom: "-16%", left: "6%", width: "70vw", height: "42vh", opacity: 0.95 }} />
      <div className="cloud" style={{ bottom: "0%", left: "-16%", width: "48vw", height: "30vh", opacity: 0.55 }} />
      <div className="cloud" style={{ bottom: "-8%", right: "-14%", width: "52vw", height: "38vh", opacity: 0.9 }} />
      <div className="cloud" style={{ bottom: "14%", right: "4%", width: "46vw", height: "18vh", opacity: 0.55 }} />
      <div className="cloud" style={{ bottom: "20%", left: "26%", width: "26vw", height: "10vh", opacity: 0.4 }} />

      {/* dotted mountain + lines */}
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="hero-chart pointer-events-none absolute bottom-0 left-0 w-full">
        <polyline points={FAINT} fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="0.9" />
        <g className="mountain-range" fill="#0b2d78" opacity="0.35" transform="translate(-210 48) scale(1.3 0.82)">
          {DOTS.map(([x, y]) => (
            <circle key={`left-range-${x}-${y}`} cx={x} cy={y} r="3.2" />
          ))}
        </g>
        <g className="mountain-range" fill="#174b9c" opacity="0.3" transform="translate(220 64) scale(0.96 0.72)">
          {DOTS.map(([x, y]) => (
            <circle key={`right-range-${x}-${y}`} cx={x} cy={y} r="3.1" />
          ))}
        </g>
        <g className="mountain-shadow" fill="#061653" opacity="0.3" transform="translate(2 2)">
          {DOTS.map(([x, y]) => (
            <circle key={`shadow-${x}-${y}`} cx={x} cy={y} r="3.4" />
          ))}
        </g>
        <g className="mountain-dots" fill="white">
          {DOTS.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.9" />
          ))}
        </g>
        <polyline points={LINE} fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="1.1" />
        {/* <circle cx={LABEL_X} cy={LABEL_Y} r="2.2" fill="white" /> */}
        {/* <text
          x={LABEL_X + 8}
          y={LABEL_Y - 5}
          fill="white"
          fontSize="6.5"
          letterSpacing="1"
          className="font-sans"
        >
          BACKTESTED SINCE 2020
        </text> */}
      </svg>

      {/* header */}
      <header className="hero-header relative flex items-start justify-between px-10 pt-7">
        <h1 className="hero-title font-serif text-[clamp(52px,6.6vw,96px)] leading-[0.92] tracking-[-0.015em]">
          Options built to
          <br />
          withstand any
          <br />
          <em>volatility</em>
        </h1>
        <div className="hero-meta flex items-center gap-10 pt-1">
          <Clock />
          <Link href="/" className="flex items-center gap-2 text-[14px] font-medium">
            <Mark className="size-4" />
            OptionPilot
          </Link>
        </div>
      </header>

      {/* halftone sphere */}
      <svg viewBox="-45 -45 90 90" className="hero-sphere absolute left-1/2 opacity-75">
        {SPHERE.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="white" />
        ))}
      </svg>

      {/* right copy */}
      {/* <div className="absolute right-10 top-[30%] flex flex-col items-end text-right">
        <p className="max-w-[260px] text-[13px] leading-snug text-white/85">
          OptionPilot builds and stress-tests options strategies for Indian equity and index traders.
        </p>
        <h2 className="mt-5 font-serif text-[clamp(24px,2.5vw,36px)] leading-[1.05]">
          Defined risk.
          <br />
          Clear payoff. No noise.
        </h2>
        <Link
          href="/dashboard"
          className="mt-7 rounded-[5px] bg-white px-4 py-2 text-[12px] font-medium text-[#0a1f5c] hover:bg-white/90"
        >
          Open dashboard
        </Link>
      </div> */}

      {/* badges */}
      <div className="hero-badges absolute bottom-7 left-10 flex gap-1.5">
        {BADGES.map((b) => (
          <span
            key={b}
            className="flex size-11 items-center justify-center rounded-full border border-white/80 text-[10px] font-semibold tracking-wide"
          >
            {b}
          </span>
        ))}
      </div>

      {/* pill nav */}
      <nav className="hero-nav absolute bottom-6 left-1/2 flex items-center gap-1 rounded-full bg-[#0b0b0e] p-1.5 pr-1.5 text-[12px] shadow-2xl">
        <span className="mr-2 flex size-9 items-center justify-center rounded-full bg-white text-black">
          <Mark className="size-4" />
        </span>
        {NAV.map((n) => (
          <a key={n} href="#" className="px-3 py-1.5 text-white/90 hover:text-white">
            {n}
          </a>
        ))}
        <a href="#" className="ml-1 rounded-full bg-[#2b2b30] px-4 py-2 text-white">
          More
        </a>
      </nav>
    </main>
  );
}
