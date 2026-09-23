"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePageTransition } from "@/app/components/loading-overlay";

const NAV = ["Overview", "Strategies", "Analyze", "Insights", "Pricing", "Access"];
const BADGES = ["NSE", "BSE", "F&O"];

const SECTIONS: Record<string, string> = { Overview: "overview", Strategies: "strategies", Analyze: "analyze" };

const FACTS = [
  { k: "Defined risk", v: "Every structure caps its own downside before you ever enter it." },
  { k: "NSE · BSE · F&O", v: "Equity and index options across the Indian markets you trade." },
  { k: "Plain-English", v: "An LLM explains the reasoning, not just the raw Greeks." },
];

const STRATEGIES = [
  { name: "Bull Call Spread", tag: "Directional · Bullish", desc: "Buy a call, sell a higher one. Capped cost, capped gain — a clean bet on a move up." },
  { name: "Bear Put Spread", tag: "Directional · Bearish", desc: "Profit as the underlying falls to target, with your downside defined from the start." },
  { name: "Iron Condor", tag: "Neutral · Range", desc: "Sell a call spread and a put spread. Collect premium while price stays inside the band." },
  { name: "Iron Butterfly", tag: "Neutral · Pinning", desc: "Tighter wings, richer premium — for when you expect price to settle near a strike." },
  { name: "Covered Call", tag: "Income · Holdings", desc: "Earn premium on shares you already own, trading a little upside for steady yield." },
  { name: "Cash-Secured Put", tag: "Income · Entry", desc: "Get paid to name the price you'd happily buy the underlying at." },
  { name: "Calendar Spread", tag: "Volatility · Time", desc: "Sell near-term, buy longer-dated. Harvest time decay across two expiries." },
  { name: "Straddle / Strangle", tag: "Volatility · Events", desc: "Position for a large move in either direction around earnings and event catalysts." },
];

const STEPS = [
  { n: "01", title: "Market context", desc: "Pulls the live option chain — implied volatility, open interest, and the underlying's trend and levels." },
  { n: "02", title: "Payoff modeling", desc: "Computes max profit, max loss, breakevens, and probability of profit across the price range at expiry." },
  { n: "03", title: "LLM reasoning", desc: "A language model weighs the setup against current conditions and your risk profile, in plain English." },
  { n: "04", title: "Recommendation", desc: "A ranked verdict — enter, adjust, or skip — with the reasoning and the numbers shown side by side." },
];

const RIDGE_LINE =
  "-520,585 -440,560 -360,572 -280,540 -200,548 -120,510 -60,470 0,395 28,360 55,398 95,384 175,381 230,348 285,314 340,284 400,238 450,204 485,174 500,162 520,174 560,204 600,239 645,284 680,319 700,344 730,318 760,289 795,269 820,261 845,284 875,314 905,349 930,329 955,294 975,319 1000,398 1024,468";

const SPHERE: [number, number, number][] = [];
for (let lat = -75; lat <= 75; lat += 15) {
  const r = 40 * Math.cos((lat * Math.PI) / 180);
  const cy = 40 * Math.sin((lat * Math.PI) / 180);
  const n = Math.max(6, Math.round(r / 3.2));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
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

export default function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const { navigateWithLoader } = usePageTransition();

  const handleAuthClick = (e: React.MouseEvent, fallbackHref: string) => {
    e.preventDefault();
    if (isLoggedIn) {
      navigateWithLoader("/dashboard", "Entering Strategy Terminal...");
    } else {
      navigateWithLoader(fallbackHref, "Loading OptionPilot...");
    }
  };

  return (
    <main className="relative text-white select-none">
      <section id="top" className="sky relative min-h-screen overflow-hidden">
      <div className="cloud" style={{ top: "3%", right: "-6%", width: "50vw", height: "14vh", opacity: 0.7, transform: "rotate(-7deg)", filter: "blur(18px)" }} />
      <div className="cloud" style={{ top: "15%", right: "8%", width: "34vw", height: "6vh", opacity: 0.5, transform: "rotate(-5deg)", filter: "blur(14px)" }} />
      <div className="cloud" style={{ top: "22%", right: "-4%", width: "26vw", height: "5vh", opacity: 0.4, transform: "rotate(-4deg)", filter: "blur(14px)" }} />
      <div className="cloud" style={{ bottom: "-16%", left: "6%", width: "70vw", height: "42vh", opacity: 0.95 }} />
      <div className="cloud" style={{ bottom: "0%", left: "-16%", width: "48vw", height: "30vh", opacity: 0.55 }} />
      <div className="cloud" style={{ bottom: "-8%", right: "-14%", width: "52vw", height: "38vh", opacity: 0.9 }} />
      <div className="cloud" style={{ bottom: "14%", right: "4%", width: "46vw", height: "18vh", opacity: 0.55 }} />
      <div className="cloud" style={{ bottom: "20%", left: "26%", width: "26vw", height: "10vh", opacity: 0.4 }} />

      <div className="hero-photo pointer-events-none absolute bottom-0 right-0">
        <img src="/everest.jpg" alt="Mount Everest" className="h-full w-full select-none object-cover" />
        <svg viewBox="0 0 1024 682" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <polyline points={RIDGE_LINE} fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="1" vectorEffect="non-scaling-stroke" transform="translate(0 26)" />
          <polyline points={RIDGE_LINE} fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

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
          <a
            href="/auth/sign-in"
            onClick={(e) => handleAuthClick(e, "/auth/sign-in")}
            className="rounded-[5px] bg-white px-4 py-2 text-[12px] font-medium text-[#0a1f5c] hover:bg-white/90 cursor-pointer"
          >
            Sign in
          </a>
        </div>
      </header>

      <svg viewBox="-45 -45 90 90" className="hero-sphere absolute left-1/2 opacity-75">
        {SPHERE.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="white" />
        ))}
      </svg>

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
      </section>

      <div className="sky-content relative">
        <section id="overview" className="section">
          <p className="eyebrow">Overview</p>
          <h2 className="font-serif text-[clamp(34px,4.6vw,60px)] leading-[1.04] tracking-[-0.015em]">
            Options strategies built to
            <br />
            <em>withstand any volatility.</em>
          </h2>
          <p className="section-lead">
            OptionPilot designs, stress-tests, and scores defined-risk options strategies for NSE &amp; BSE equities
            and index F&amp;O. No noise, no tip-sheets — just clear payoff diagrams, defined risk, and probabilities
            you can actually act on.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {FACTS.map((f) => (
              <div key={f.k} className="border-t border-white/15 pt-5">
                <div className="font-serif text-[22px]">{f.k}</div>
                <p className="mt-2 text-[15px] leading-relaxed text-white/60">{f.v}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="strategies" className="section">
          <p className="eyebrow">Strategies</p>
          <h2 className="font-serif text-[clamp(34px,4.6vw,60px)] leading-[1.04] tracking-[-0.015em]">
            A library of defined-risk structures.
          </h2>
          <p className="section-lead">
            Pick a market view — up, down, sideways, or volatile — and OptionPilot assembles the structure, sizes the
            legs, and shows the trade-off before you commit a rupee.
          </p>
          <div className="mt-14 grid gap-3 sm:grid-cols-2">
            {STRATEGIES.map((s) => (
              <div
                key={s.name}
                className="rounded-2xl border border-white/12 bg-white/[0.04] p-6 transition hover:bg-white/[0.07]"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-serif text-[26px] leading-tight">{s.name}</h3>
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    {s.tag}
                  </span>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-white/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="analyze" className="section pb-44">
          <p className="eyebrow">Analyze</p>
          <h2 className="font-serif text-[clamp(34px,4.6vw,60px)] leading-[1.04] tracking-[-0.015em]">
            Every strategy, scored by an <em>LLM analyst.</em>
          </h2>
          <p className="section-lead">
            OptionPilot doesn&apos;t just draw payoff curves — it reasons about them. Live market data is combined with
            a language model that weighs the setup and hands back a recommendation you can read in seconds.
          </p>
          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((st) => (
              <div key={st.n}>
                <div className="font-serif text-[40px] leading-none text-white/30">{st.n}</div>
                <h3 className="mt-3 text-[17px] font-semibold">{st.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/60">{st.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 rounded-2xl border border-white/12 bg-white/[0.04] p-8">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/45">Sample verdict</p>
            <p className="mt-4 font-serif text-[clamp(22px,2.4vw,32px)] leading-snug">
              &ldquo;Iron Condor on NIFTY, 21-day expiry. IV rank is high and price is range-bound, so premium is rich
              relative to risk.{" "}
              <span className="text-white/55">
                Probability of profit 68%, max loss capped at ₹6,200. Recommendation: enter, size at 2% of capital.&rdquo;
              </span>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/auth/sign-in"
                onClick={(e) => handleAuthClick(e, "/auth/sign-in")}
                className="rounded-[5px] bg-white px-4 py-2 text-[12px] font-medium text-[#0a1f5c] hover:bg-white/90 cursor-pointer"
              >
                Sign in
              </a>
              <a
                href="/auth/sign-up"
                onClick={(e) => handleAuthClick(e, "/auth/sign-up")}
                className="rounded-[5px] border border-white/40 px-4 py-2 text-[12px] font-medium text-white hover:bg-white/10 cursor-pointer"
              >
                Create account
              </a>
            </div>
          </div>
        </section>
      </div>

      <nav className="hero-nav fixed bottom-6 left-1/2 z-50 flex items-center gap-1 rounded-full bg-[#0b0b0e] p-1.5 pr-1.5 text-[12px] shadow-2xl">
        <a href="#top" className="mr-2 flex size-9 items-center justify-center rounded-full bg-white text-black">
          <Mark className="size-4" />
        </a>
        {NAV.map((n) => (
          n === "Access" ? (
            <a
              key={n}
              href="/auth/sign-in"
              onClick={(e) => handleAuthClick(e, "/auth/sign-in")}
              className="px-3 py-1.5 text-white/90 hover:text-white cursor-pointer"
            >
              {n}
            </a>
          ) : (
            <a
              key={n}
              href={SECTIONS[n] ? `#${SECTIONS[n]}` : "#top"}
              className={`px-3 py-1.5 text-white/90 hover:text-white ${SECTIONS[n] ? "" : "max-sm:hidden"}`}
            >
              {n}
            </a>
          )
        ))}
        <a
          href="/auth/sign-up"
          onClick={(e) => handleAuthClick(e, "/auth/sign-up")}
          className="ml-1 rounded-full bg-[#2b2b30] px-4 py-2 text-white max-sm:hidden cursor-pointer"
        >
          Sign up
        </a>
      </nav>
    </main>
  );
}
