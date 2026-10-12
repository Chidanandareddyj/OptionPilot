"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePageTransition } from "@/app/components/loading-overlay";

import { ThinkingOrb } from "thinking-orbs";

const NAV = ["Strategies", "Analyze", "Insights", "Pricing"];
const BADGES = ["NSE", "BSE", "F&O"];
const SECTIONS: Record<string, string> = {
  Strategies: "strategies",
  Analyze: "analyze",
  Insights: "insights",
  Pricing: "pricing",
};

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

        {/* Top Header Bar */}
        <div className="relative z-20 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-7">
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2.5 text-[19px] sm:text-[22px] font-semibold tracking-tight text-white hover:text-white/80 transition-colors cursor-pointer"
          >
            <Mark className="size-5 sm:size-6 text-sky-400" />
            <span>OptionPilot</span>
          </Link>
          <div className="hero-meta flex items-center gap-4 sm:gap-8">
            <Clock />
            <a
              href={isLoggedIn ? "/dashboard" : "/auth/sign-in"}
              onClick={(e) => handleAuthClick(e, "/auth/sign-in")}
              className="rounded-[5px] bg-white px-4 py-2 text-[12px] font-medium text-[#0a1f5c] hover:bg-white/90 cursor-pointer shadow-sm transition-all"
            >
              {isLoggedIn ? "Dashboard" : "Sign in"}
            </a>
          </div>
        </div>

        {/* Hero Title */}
        <header className="hero-header relative px-6 pt-8 sm:px-10 sm:pt-10">
          <h1 className="hero-title font-serif text-[clamp(52px,6.6vw,96px)] leading-[0.92] tracking-[-0.015em]">
            Options built to
            <br />
            withstand any
            <br />
            <em>volatility</em>
          </h1>
        </header>

        <ThinkingOrb
          state="searching"
          size={64}
          theme="dark"
          className="hero-sphere absolute left-1/2"
          style={{ width: 125, height: 125 }}
        />

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

        <section id="analyze" className="section">
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

        <section id="insights" className="section">
          <p className="eyebrow">Insights</p>
          <h2 className="font-serif text-[clamp(34px,4.6vw,60px)] leading-[1.04] tracking-[-0.015em]">
            Real-time volatility intelligence &amp; <em>quant edge.</em>
          </h2>
          <p className="section-lead">
            OptionPilot synthesizes implied volatility versus 30-day realized volatility, calculating statistical expected values and probability of profit across every liquid strike.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-6">
              <div className="font-serif text-[22px] text-sky-300">Expected Value (EV)</div>
              <p className="mt-2 text-[14px] leading-relaxed text-white/60">
                Mathematical expectation in rupees per lot, evaluating win/loss probabilities against maximum payoff targets.
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-6">
              <div className="font-serif text-[22px] text-emerald-300">Probability of Profit (POP)</div>
              <p className="mt-2 text-[14px] leading-relaxed text-white/60">
                Integrated log-normal probability distribution between calculated breakeven thresholds at expiry.
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-6">
              <div className="font-serif text-[22px] text-indigo-300">IV vs Realized Vol Ratio</div>
              <p className="mt-2 text-[14px] leading-relaxed text-white/60">
                Identifies whether options are overpricing or underpricing recent movement to score net debit versus credit advantage.
              </p>
            </div>
          </div>
        </section>

        <section id="pricing" className="section pb-44">
          <p className="eyebrow">Pricing</p>
          <h2 className="font-serif text-[clamp(34px,4.6vw,60px)] leading-[1.04] tracking-[-0.015em]">
            Professional options tooling. <em>Zero subscriptions.</em>
          </h2>
          <p className="section-lead">
            Built for Indian retail traders to level the playing field against institutions. All defined-risk strategies, live NSE &amp; BSE option chains, and quant modeling are completely free.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/[0.06] p-7">
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-[24px]">Community Trader</h3>
                <span className="font-mono text-2xl font-bold text-emerald-300">₹0 <span className="text-xs font-normal text-white/50">/ forever</span></span>
              </div>
              <p className="mt-2 text-xs text-white/60">Full access to the strategy terminal, live option chains, and all 12 defined-risk structures.</p>
              <ul className="mt-6 space-y-2 text-xs text-white/70">
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Live NSE &amp; BSE F&amp;O Option Chains</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> All 12 Defined-Risk Strategies</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Complete Lot Size Payoffs &amp; Breakevens</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> AI Strategy Explanations &amp; Quant Scoring</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Saved Snapshots &amp; Analysis History</li>
              </ul>
              <div className="mt-8">
                <a
                  href={isLoggedIn ? "/dashboard" : "/auth/sign-in"}
                  onClick={(e) => handleAuthClick(e, "/auth/sign-in")}
                  className="inline-block rounded-[5px] bg-white px-5 py-2.5 text-[12px] font-semibold text-[#0a1f5c] hover:bg-white/90 cursor-pointer"
                >
                  {isLoggedIn ? "Open Strategy Terminal" : "Get Started Free"}
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-[24px]">Open Source &amp; Serverless</h3>
                  <span className="font-mono text-xs font-semibold text-sky-300">MIT / Open</span>
                </div>
                <p className="mt-2 text-xs text-white/60">Built on Next.js, Neon Serverless PostgreSQL, and Upstox market APIs. Deployable anywhere.</p>
                <ul className="mt-6 space-y-2 text-xs text-white/70">
                  <li className="flex items-center gap-2"><span className="text-sky-400">✓</span> Direct broker API integration (Upstox V2)</li>
                  <li className="flex items-center gap-2"><span className="text-sky-400">✓</span> Neon PostgreSQL storage for session &amp; analysis rows</li>
                  <li className="flex items-center gap-2"><span className="text-sky-400">✓</span> Self-hostable on Vercel or cloud VPS</li>
                </ul>
              </div>
              <div className="mt-8">
                <a
                  href="https://github.com/Chidanandareddyj/OptionPilot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-[5px] border border-white/20 bg-white/5 px-5 py-2.5 text-[12px] font-medium text-white hover:bg-white/10"
                >
                  View on GitHub →
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <nav className="hero-nav fixed top-5 left-1/2 z-50 flex items-center gap-1 rounded-full bg-[#0b0b0e] p-1.5 px-3 text-[12px] shadow-2xl border border-white/10 backdrop-blur-md">
        {NAV.map((n) => (
          <a
            key={n}
            href={SECTIONS[n] ? `#${SECTIONS[n]}` : "#top"}
            className="rounded-full px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            {n}
          </a>
        ))}
      </nav>
    </main>
  );
}
