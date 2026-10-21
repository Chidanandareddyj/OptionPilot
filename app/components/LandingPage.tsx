"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePageTransition } from "@/app/components/loading-overlay";
import { OptionPilotLogo } from "@/app/components/OptionPilotLogo";

import { ThinkingOrb } from "thinking-orbs";

const NAV = ["Overview", "Strategies", "Analyze", "Insights", "Pricing"];
const BADGES = ["NSE", "BSE", "F&O"];
const SECTIONS: Record<string, string> = {
  Overview: "overview",
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


export default function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const { navigateWithLoader } = usePageTransition();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position to seamlessly transition mobile header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on desktop resize or on Escape key
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleAuthClick = (e: React.MouseEvent, fallbackHref: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (isLoggedIn) {
      navigateWithLoader("/dashboard", "Entering Strategy Terminal...");
    } else {
      navigateWithLoader(fallbackHref, "Loading OptionPilot...");
    }
  };

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (sectionId === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="relative text-white select-none">
      {/* Mobile & Tablet Fixed Header (< 1024px) */}
      <header
        className={`lg:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 sm:px-6 transition-all duration-300 flex items-center justify-between ${
          isScrolled || mobileMenuOpen
            ? "bg-[#06245e]/80 backdrop-blur-md shadow-lg"
            : "bg-transparent shadow-none"
        }`}
      >
        <Link
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setMobileMenuOpen(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2 text-[18px] sm:text-[19px] font-semibold tracking-tight text-white hover:text-white/80 transition-colors cursor-pointer"
        >
          <OptionPilotLogo variant="adaptive" className="size-7 sm:size-7.5 text-white shrink-0" />
          <span>OptionPilot</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:inline-flex items-center">
            <Clock />
          </div>
          <Link
            href={isLoggedIn ? "/dashboard" : "/auth/sign-in"}
            onClick={(e) => handleAuthClick(e, "/auth/sign-in")}
            className="inline-flex items-center justify-center rounded-[5px] bg-white px-3.5 h-8 text-[11.5px] sm:text-[12px] font-semibold text-[#0a1f5c] hover:bg-white/90 cursor-pointer shadow-sm transition-all"
          >
            {isLoggedIn ? "Dashboard" : "Sign in"}
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex size-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white active:scale-95 transition"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu: Floating Rounded Glass Card */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 px-3 pt-2 pb-4">
            <div className="rounded-2xl bg-[#07245c]/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 sm:hidden text-xs text-white/70">
                <Clock />
                <div className="flex gap-1.5">
                  {BADGES.map((b) => (
                    <span
                      key={b}
                      className="rounded bg-white/15 px-2 py-0.5 text-[9px] font-semibold text-white/90"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
              <div className="h-px bg-white/10 sm:hidden mb-2" />
              <nav className="flex flex-col py-1 gap-0.5">
                {NAV.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleNavClick(SECTIONS[n] || "top")}
                    className="flex items-center justify-between w-full text-left rounded-lg px-3.5 py-2.5 text-[13px] font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{n}</span>
                    <span className="text-xs text-white/40">→</span>
                  </button>
                ))}
              </nav>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex flex-col gap-2">
                <Link
                  href={isLoggedIn ? "/dashboard" : "/auth/sign-up"}
                  onClick={(e) => handleAuthClick(e, "/auth/sign-up")}
                  className="w-full inline-flex items-center justify-center h-10 rounded-[5px] bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-white transition-all shadow-sm"
                >
                  {isLoggedIn ? "Open Strategy Terminal" : "Create Free Account"}
                </Link>
                <a
                  href="https://github.com/Chidanandareddyj/OptionPilot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center h-8 text-xs text-white/60 hover:text-white transition-colors"
                >
                  GitHub Repository ↗
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

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

        {/* Desktop Top Header Bar (>= 1024px) */}
        <div className="hidden lg:flex relative z-20 items-center justify-between px-10 pt-6">
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2.5 text-[22px] font-semibold tracking-tight text-white hover:text-white/80 transition-colors cursor-pointer"
          >
            <OptionPilotLogo variant="adaptive" className="size-8 sm:size-8.5 text-white shrink-0" />
            <span>OptionPilot</span>
          </Link>
          <div className="hero-meta flex items-center gap-6">
            <Clock />
            <Link
              href={isLoggedIn ? "/dashboard" : "/auth/sign-in"}
              onClick={(e) => handleAuthClick(e, "/auth/sign-in")}
              className="inline-flex items-center justify-center rounded-[5px] bg-white px-4 h-8 text-[12px] font-semibold text-[#0a1f5c] hover:bg-white/90 cursor-pointer shadow-sm transition-all"
            >
              {isLoggedIn ? "Dashboard" : "Sign in"}
            </Link>
          </div>
        </div>

        {/* Hero Title */}
        <header className="hero-header relative px-6 pt-6 sm:px-10 sm:pt-10">
          <h1 className="hero-title font-serif text-[clamp(44px,6.6vw,96px)] leading-[0.92] tracking-[-0.015em]">
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

        <div className="hero-badges absolute bottom-7 left-6 sm:left-10 flex gap-1.5">
          {BADGES.map((b) => (
            <span
              key={b}
              className="flex size-10 sm:size-11 items-center justify-center rounded-full border border-white/80 text-[10px] font-semibold tracking-wide"
            >
              {b}
            </span>
          ))}
        </div>
      </section>

      <div className="sky-content relative">
        <section id="overview" className="section">
          <p className="eyebrow">Overview</p>
          <h2 className="font-serif text-[clamp(30px,4.4vw,56px)] leading-[1.04] tracking-[-0.015em]">
            Options strategies built to
            <br />
            <em>withstand any volatility.</em>
          </h2>
          <p className="section-lead">
            OptionPilot designs, stress-tests, and scores defined-risk options strategies for NSE &amp; BSE equities
            and index F&amp;O. No noise, no tip-sheets — just clear payoff diagrams, defined risk, and probabilities
            you can actually act on.
          </p>
          <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
            {FACTS.map((f) => (
              <div key={f.k} className="border-t border-white/15 pt-4">
                <div className="font-serif text-[19px] sm:text-[21px]">{f.k}</div>
                <p className="mt-1.5 text-[13.5px] sm:text-[14.5px] leading-relaxed text-white/60">{f.v}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="strategies" className="section">
          <div className="text-center max-w-2xl mx-auto">
            <p className="eyebrow">Strategies</p>
            <h2 className="font-serif text-[clamp(28px,4vw,52px)] leading-[1.04] tracking-[-0.015em]">
              A library of defined-risk structures.
            </h2>
            <p className="section-lead mx-auto">
              Pick a market view — up, down, sideways, or volatile — and OptionPilot assembles the structure, sizes the
              legs, and shows the trade-off before you commit a rupee.
            </p>
          </div>
          <div className="mt-6 sm:mt-7 grid gap-2.5 grid-cols-1 sm:grid-cols-2">
            {STRATEGIES.map((s) => (
              <div
                key={s.name}
                className="rounded-xl border border-white/12 bg-white/[0.04] p-3.5 sm:p-4 transition hover:bg-white/[0.07]"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-3">
                  <h3 className="font-serif text-[20px] sm:text-[22px] leading-tight">{s.name}</h3>
                  <span className="shrink-0 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    {s.tag}
                  </span>
                </div>
                <p className="mt-1 text-[13px] sm:text-[13.5px] leading-relaxed text-white/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="analyze" className="section">
          <div className="text-center max-w-2xl mx-auto">
            <p className="eyebrow">Analyze</p>
            <h2 className="font-serif text-[clamp(28px,4vw,52px)] leading-[1.04] tracking-[-0.015em]">
              Every strategy, scored by an <em>LLM analyst.</em>
            </h2>
            <p className="section-lead mx-auto">
              OptionPilot doesn&apos;t just draw payoff curves — it reasons about them. Live market data is combined with
              a language model that weighs the setup and hands back a recommendation you can read in seconds.
            </p>
          </div>
          <div className="mt-6 sm:mt-7 grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((st) => (
              <div key={st.n} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4 flex flex-col items-center text-center">
                <div className="font-serif text-[28px] sm:text-[32px] leading-none text-white/30">{st.n}</div>
                <h3 className="mt-1.5 text-[14.5px] sm:text-[15px] font-semibold">{st.title}</h3>
                <p className="mt-1 text-[12.5px] sm:text-[13px] leading-relaxed text-white/60">{st.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 sm:mt-5 rounded-xl border border-white/12 bg-white/[0.04] p-4 sm:p-5 text-center max-w-3xl mx-auto">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/45">Sample verdict</p>
            <p className="mt-2 font-serif text-[clamp(18px,2vw,26px)] leading-snug">
              &ldquo;Iron Condor on NIFTY, 21-day expiry. IV rank is high and price is range-bound, so premium is rich
              relative to risk.{" "}
              <span className="text-white/55">
                Probability of profit 68%, max loss capped at ₹6,200. Recommendation: enter, size at 2% of capital.&rdquo;
              </span>
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <Link
                href="/auth/sign-in"
                onClick={(e) => handleAuthClick(e, "/auth/sign-in")}
                className="inline-flex items-center justify-center rounded-[5px] bg-white px-5 h-8.5 text-[12px] font-semibold text-[#0a1f5c] hover:bg-white/90 cursor-pointer shadow-sm transition-all"
              >
                Sign in
              </Link>
              <Link
                href="/auth/sign-up"
                onClick={(e) => handleAuthClick(e, "/auth/sign-up")}
                className="inline-flex items-center justify-center rounded-[5px] border border-white/30 px-5 h-8.5 text-[12px] font-medium text-white hover:bg-white/10 cursor-pointer transition-all"
              >
                Create account
              </Link>
            </div>
          </div>
        </section>

        <section id="insights" className="section min-h-screen flex flex-col justify-center py-20 sm:py-28">
          <p className="eyebrow">Insights</p>
          <h2 className="font-serif text-[clamp(30px,4.4vw,56px)] leading-[1.04] tracking-[-0.015em]">
            Real-time volatility intelligence &amp; <em>quant edge.</em>
          </h2>
          <p className="section-lead">
            OptionPilot synthesizes implied volatility versus 30-day realized volatility, calculating statistical expected values and probability of profit across every liquid strike.
          </p>
          <div className="mt-8 sm:mt-10 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-xl border border-white/12 bg-white/[0.04] p-5">
              <div className="font-serif text-[19px] sm:text-[21px] text-sky-300">Expected Value (EV)</div>
              <p className="mt-1.5 text-[13.5px] sm:text-[14px] leading-relaxed text-white/60">
                Mathematical expectation in rupees per lot, evaluating win/loss probabilities against maximum payoff targets.
              </p>
            </div>
            <div className="rounded-xl border border-white/12 bg-white/[0.04] p-5">
              <div className="font-serif text-[19px] sm:text-[21px] text-emerald-300">Probability of Profit (POP)</div>
              <p className="mt-1.5 text-[13.5px] sm:text-[14px] leading-relaxed text-white/60">
                Integrated log-normal probability distribution between calculated breakeven thresholds at expiry.
              </p>
            </div>
            <div className="rounded-xl border border-white/12 bg-white/[0.04] p-5">
              <div className="font-serif text-[19px] sm:text-[21px] text-indigo-300">IV vs Realized Vol Ratio</div>
              <p className="mt-1.5 text-[13.5px] sm:text-[14px] leading-relaxed text-white/60">
                Identifies whether options are overpricing or underpricing recent movement to score net debit versus credit advantage.
              </p>
            </div>
          </div>
        </section>

        <section id="pricing" className="section pb-20 sm:pb-28">
          <p className="eyebrow">Pricing</p>
          <h2 className="font-serif text-[clamp(30px,4.4vw,56px)] leading-[1.04] tracking-[-0.015em]">
            Professional options tooling. <em>Zero subscriptions.</em>
          </h2>
          <p className="section-lead">
            Built for Indian retail traders to level the playing field against institutions. All defined-risk strategies, live NSE &amp; BSE option chains, and quant modeling are completely free.
          </p>
          <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-5 grid-cols-1 lg:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/[0.06] p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-[21px] sm:text-[23px]">Community Trader</h3>
                  <span className="font-mono text-xl sm:text-2xl font-bold text-emerald-300">₹0 <span className="text-xs font-normal text-white/50">/ forever</span></span>
                </div>
                <p className="mt-2 text-xs text-white/60">Full access to the strategy terminal, live option chains, and all 12 defined-risk structures.</p>
                <ul className="mt-4 space-y-2 text-xs text-white/70">
                  <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Live NSE &amp; BSE F&amp;O Option Chains</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> All 12 Defined-Risk Strategies</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Complete Lot Size Payoffs &amp; Breakevens</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> AI Strategy Explanations &amp; Quant Scoring</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Saved Snapshots &amp; Analysis History</li>
                </ul>
              </div>
              <div className="mt-6 pt-2">
                <Link
                  href={isLoggedIn ? "/dashboard" : "/auth/sign-in"}
                  onClick={(e) => handleAuthClick(e, "/auth/sign-in")}
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-[5px] bg-white px-6 h-10 text-[12px] font-semibold text-[#0a1f5c] hover:bg-white/90 cursor-pointer shadow-sm transition-all"
                >
                  {isLoggedIn ? "Open Strategy Terminal" : "Get Started Free"}
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-white/12 bg-white/[0.04] p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-[21px] sm:text-[23px]">Open Source &amp; Serverless</h3>
                  <span className="font-mono text-xs font-semibold text-sky-300">MIT / Open</span>
                </div>
                <p className="mt-2 text-xs text-white/60">Built on Next.js, Neon Serverless PostgreSQL, and Upstox market APIs. Deployable anywhere.</p>
                <ul className="mt-4 space-y-2 text-xs text-white/70">
                  <li className="flex items-center gap-2"><span className="text-sky-400">✓</span> Direct broker API integration (Upstox V2)</li>
                  <li className="flex items-center gap-2"><span className="text-sky-400">✓</span> Neon PostgreSQL storage for session &amp; analysis rows</li>
                  <li className="flex items-center gap-2"><span className="text-sky-400">✓</span> Self-hostable on Vercel or cloud VPS</li>
                </ul>
              </div>
              <div className="mt-6 pt-2">
                <a
                  href="https://github.com/Chidanandareddyj/OptionPilot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-[5px] border border-white/20 bg-white/5 px-6 h-10 text-[12px] font-medium text-white hover:bg-white/10 transition-all"
                >
                  View on GitHub →
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Desktop Centered Floating Nav Pill (>= 1024px) */}
      <nav className="hero-nav fixed top-5 left-1/2 z-50 hidden lg:flex items-center gap-1 rounded-full bg-[#06245e]/70 p-1.5 px-3 text-[12px] shadow-2xl backdrop-blur-md">
        {NAV.map((n) => (
          <a
            key={n}
            href={SECTIONS[n] ? `#${SECTIONS[n]}` : "#top"}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(SECTIONS[n] || "top");
            }}
            className="rounded-full px-3.5 py-1.5 text-center text-[12px] font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors tracking-wide cursor-pointer"
          >
            {n}
          </a>
        ))}
      </nav>
    </main>
  );
}
