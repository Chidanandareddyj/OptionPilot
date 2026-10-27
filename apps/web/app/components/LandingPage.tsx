"use client";

import { ArrowRightIcon, CheckCircleIcon, CheckIcon, GithubLogoIcon } from "@phosphor-icons/react";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePageTransition } from "@/app/components/loading-overlay";
import type { PayoffPoint } from "@/lib/payoff-series";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { LandingNav } from "./landing-nav";
import { MarketClock } from "./market-clock";
import { MarketTicker } from "./market-ticker";
import { PayoffFigure } from "./payoff-figure";
import { ScrollReveal } from "./scroll-reveal";
import { Sparkline } from "./sparkline";
import { ViewBadge, type MarketView } from "./view-badge";

const GITHUB_URL = "https://github.com/Chidanandareddyj/OptionPilot";

const FACTS = [
  { k: "Defined risk", v: "Every structure caps its own downside before you ever enter it." },
  { k: "NSE · BSE · F&O", v: "Equity and index options across the Indian markets you trade." },
  { k: "Plain-English", v: "An LLM explains the reasoning, not just the raw Greeks." },
];

// Payoff shapes are schematic, in abstract units: they show the profile, not prices.
const shape = (...pts: [number, number][]): PayoffPoint[] => pts.map(([price, pnl]) => ({ price, pnl }));

const STRATEGIES: { name: string; view: MarketView; tag: string; desc: string; shape: PayoffPoint[] }[] = [
  {
    name: "Bull Call Spread",
    view: "bullish",
    tag: "Directional",
    desc: "Buy a call, sell a higher one. Capped cost, capped gain — a clean bet on a move up.",
    shape: shape([0, -4], [38, -4], [62, 6], [100, 6]),
  },
  {
    name: "Bear Put Spread",
    view: "bearish",
    tag: "Directional",
    desc: "Profit as the underlying falls to target, with your downside defined from the start.",
    shape: shape([0, 4], [35, 4], [60, -6], [100, -6]),
  },
  {
    name: "Iron Condor",
    view: "neutral",
    tag: "Range",
    desc: "Sell a call spread and a put spread. Collect premium while price stays inside the band.",
    shape: shape([0, -4], [20, -4], [38, 2.5], [62, 2.5], [80, -4], [100, -4]),
  },
  {
    name: "Iron Butterfly",
    view: "neutral",
    tag: "Pinning",
    desc: "Tighter wings, richer premium — for when you expect price to settle near a strike.",
    shape: shape([0, -3], [30, -3], [50, 3.5], [70, -3], [100, -3]),
  },
  {
    name: "Covered Call",
    view: "income",
    tag: "Holdings",
    desc: "Earn premium on shares you already own, trading a little upside for steady yield.",
    shape: shape([0, -8], [55, 3], [100, 3]),
  },
  {
    name: "Cash-Secured Put",
    view: "income",
    tag: "Entry",
    desc: "Get paid to name the price you'd happily buy the underlying at.",
    shape: shape([0, -8], [45, 1.5], [100, 1.5]),
  },
  {
    name: "Calendar Spread",
    view: "volatile",
    tag: "Time",
    desc: "Sell near-term, buy longer-dated. Harvest time decay across two expiries.",
    shape: shape([0, -2], [25, -1.5], [40, 1.5], [50, 3], [60, 1.5], [75, -1.5], [100, -2]),
  },
  {
    name: "Straddle / Strangle",
    view: "volatile",
    tag: "Events",
    desc: "Position for a large move in either direction around earnings and event catalysts.",
    shape: shape([0, 6], [50, -4], [100, 6]),
  },
];

const STEPS = [
  { n: "01", title: "Market context", desc: "Pulls the live option chain — implied volatility, open interest, and the underlying's trend and levels." },
  { n: "02", title: "Payoff modeling", desc: "Computes max profit, max loss, breakevens, and probability of profit across the price range at expiry." },
  { n: "03", title: "LLM reasoning", desc: "A language model weighs the setup against current conditions and your risk profile, in plain English." },
  { n: "04", title: "Recommendation", desc: "A ranked verdict — enter, adjust, or skip — with the reasoning and the numbers shown side by side." },
];

const INSIGHTS = [
  { title: "Expected Value (EV)", desc: "Mathematical expectation in rupees per lot, evaluating win/loss probabilities against maximum payoff targets." },
  { title: "Probability of Profit (POP)", desc: "Integrated log-normal probability distribution between calculated breakeven thresholds at expiry." },
  { title: "IV vs Realized Vol Ratio", desc: "Identifies whether options are overpricing or underpricing recent movement to score net debit versus credit advantage." },
];

const COMMUNITY_FEATURES = [
  "Live NSE & BSE F&O Option Chains",
  "All 12 Defined-Risk Strategies",
  "Complete Lot Size Payoffs & Breakevens",
  "AI Strategy Explanations & Quant Scoring",
  "Saved Snapshots & Analysis History",
];

const OPEN_SOURCE_FEATURES = [
  "Direct broker API integration (Upstox V2)",
  "Neon PostgreSQL storage for session & analysis rows",
  "Self-hostable on Vercel or cloud VPS",
];

const FAQ = [
  { q: "Is OptionPilot really free?", a: "Yes. The Community Trader plan costs ₹0 forever, and the code is open source on GitHub." },
  { q: "Which markets does it cover?", a: "NSE and BSE equities and index F&O, using live option chains from the Upstox market APIs." },
  { q: "Does it place orders for me?", a: "No. OptionPilot is built for analysis and explanation. Order placement is not part of what it does." },
  { q: "Is this investment advice?", a: "No. OptionPilot is an educational tool. Options carry risk, and you can lose the full premium you pay." },
];

const TAGLINE =
  "Every strategy is drawn, stress tested and scored before you risk a rupee. You see the worst case first, then you decide.";

function Section({
  id,
  label,
  title,
  lead,
  children,
  className,
}: {
  id: string;
  label: string;
  title?: string;
  lead?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={title ? `${id}-title` : undefined} className={cn("scroll-mt-24 px-4 pb-24 sm:px-8 lg:px-16", className)}>
      <div className="grid gap-4 lg:grid-cols-[288px_1fr] lg:gap-16">
        <span className="pt-3 text-sm text-faint">{label}</span>
        <div className="flex min-w-0 flex-col gap-8">
          {title && (
            <div className="flex flex-col gap-4">
              <h2 id={`${id}-title`} className="max-w-[680px] text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {title}
              </h2>
              {lead && <p className="max-w-[680px] text-lg text-muted-foreground">{lead}</p>}
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

function Feature({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
      {children}
    </li>
  );
}

export default function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const { navigateWithLoader } = usePageTransition();

  const handleAuthClick = (e: MouseEvent, fallbackHref: string) => {
    e.preventDefault();
    if (isLoggedIn) {
      navigateWithLoader("/dashboard", "Entering Strategy Terminal...");
    } else {
      navigateWithLoader(fallbackHref, "Loading OptionPilot...");
    }
  };

  const authLink = (fallbackHref: string, label: string, loggedInLabel = "Open Strategy Terminal") => (
    <Link href={isLoggedIn ? "/dashboard" : fallbackHref} onClick={(e) => handleAuthClick(e, fallbackHref)}>
      {isLoggedIn ? loggedInLabel : label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav isLoggedIn={isLoggedIn} onAuthClick={handleAuthClick} />

      <main>
        <section id="overview" aria-labelledby="hero-title" className="scroll-mt-24 px-4 pt-24 pb-24 sm:px-8 lg:px-16">
          <div className="grid items-center gap-12 xl:grid-cols-[1fr_592px] xl:gap-16">
            <div className="flex flex-col gap-6">
              <h1
                id="hero-title"
                className="hero-grad max-w-[680px] pb-2 text-5xl leading-none font-semibold tracking-tighter text-balance sm:text-6xl lg:text-7xl"
              >
                Options built to withstand any volatility
              </h1>
              <p className="max-w-[680px] text-lg text-muted-foreground">
                OptionPilot designs, stress-tests, and scores defined-risk options strategies for NSE &amp; BSE equities and
                index F&amp;O. No noise, no tip-sheets — just clear payoff diagrams, defined risk, and probabilities you can
                actually act on.
              </p>
              <div className="mt-2 flex flex-col items-start gap-4">
                <Button asChild className="h-10 gap-2 px-3 text-base font-semibold">
                  <Link
                    href={isLoggedIn ? "/dashboard" : "/auth/sign-up"}
                    onClick={(e) => handleAuthClick(e, "/auth/sign-up")}
                  >
                    {isLoggedIn ? "Open Strategy Terminal" : "Create free account"}
                    <ArrowRightIcon aria-hidden className="size-5" />
                  </Link>
                </Button>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircleIcon aria-hidden weight="fill" className="size-5 shrink-0 text-primary" />
                  Free forever, open source, 12 strategies on NSE, BSE and F&amp;O.
                </span>
              </div>
            </div>

            <Card className="gap-0 p-2" aria-label="Schematic payoff diagram of a bull call spread">
              <CardHeader className="flex flex-row items-center gap-3 px-4 pt-2 pb-2">
                <div className="flex flex-col">
                  <CardTitle className="text-base font-semibold">Bull Call Spread</CardTitle>
                  <span className="text-sm text-faint">Buy a lower call, sell a higher call · at expiry</span>
                </div>
                <Badge variant="secondary" className="ml-auto h-6 rounded-md px-2 font-normal">
                  Fig. 1 · Illustrative
                </Badge>
              </CardHeader>
              <CardContent className="rounded-lg bg-background px-2 pt-2">
                <PayoffFigure height={344} />
              </CardContent>
              <CardFooter className="flex flex-wrap items-center gap-x-6 gap-y-1 border-0 bg-transparent px-4 py-3 text-sm text-muted-foreground">
                <span>Capped cost, capped gain</span>
                <span className="ml-auto">Live strikes and premiums in the terminal</span>
              </CardFooter>
            </Card>
          </div>

          <Card size="sm" className="mt-12 flex-row flex-wrap items-center gap-x-8 gap-y-2 px-6 py-3">
            <MarketClock className="text-sm" />
            <MarketTicker showStatus={false} />
            <span className="text-sm text-faint lg:ml-auto">Data from Upstox market APIs</span>
          </Card>
        </section>

        <Section id="what-you-get" label="What you get">
          <ScrollReveal
            text={TAGLINE}
            className="max-w-[680px] text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl sm:leading-none"
          />
          <dl className="grid gap-6 sm:grid-cols-3">
            {FACTS.map((f) => (
              <div key={f.k} className="flex flex-col gap-2 border-t pt-4">
                <dt className="text-base font-semibold">{f.k}</dt>
                <dd className="text-sm text-muted-foreground">{f.v}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section
          id="strategies"
          label="Strategies"
          title="A library of defined-risk structures"
          lead="Pick a market view — up, down, sideways, or volatile — and OptionPilot assembles the structure, sizes the legs, and shows the trade-off before you commit a rupee."
        >
          <Card className="p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">No.</TableHead>
                  <TableHead className="px-4 py-3">Strategy</TableHead>
                  <TableHead className="px-4 py-3">View</TableHead>
                  <TableHead className="px-4 py-3 max-md:hidden">How it works</TableHead>
                  <TableHead className="px-4 py-3 text-right">Payoff shape</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STRATEGIES.map((s, i) => (
                  <TableRow key={s.name} className="h-20">
                    <TableCell className="num w-12 px-4 text-muted-foreground">{String(i + 1).padStart(2, "0")}</TableCell>
                    <TableCell className="px-4">
                      <span className="block text-lg font-semibold sm:text-xl">{s.name}</span>
                      <span className="text-xs text-faint">{s.tag}</span>
                    </TableCell>
                    <TableCell className="px-4">
                      <ViewBadge view={s.view} />
                    </TableCell>
                    <TableCell className="max-w-sm px-4 whitespace-normal text-muted-foreground max-md:hidden">{s.desc}</TableCell>
                    <TableCell className="px-4">
                      <div className="flex justify-end">
                        <Sparkline points={s.shape} width={120} height={40} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Section>

        <Section
          id="how-it-works"
          label="How it works"
          title="Every strategy, scored by an LLM analyst"
          lead="OptionPilot doesn't just draw payoff curves — it reasons about them. Live market data is combined with a language model that weighs the setup and hands back a recommendation you can read in seconds."
        >
          <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((st) => (
              <li key={st.n}>
                <Card className="h-full gap-2 px-6 py-6">
                  <span className="num text-sm text-primary">{st.n}</span>
                  <h3 className="text-lg font-semibold">{st.title}</h3>
                  <p className="text-sm text-muted-foreground">{st.desc}</p>
                </Card>
              </li>
            ))}
          </ol>
          <Card className="max-w-[760px] gap-4 px-6 py-6">
            <span className="text-sm text-faint">Sample verdict</span>
            <blockquote className="text-xl leading-snug font-medium text-balance">
              &ldquo;Iron Condor on NIFTY, 21-day expiry. IV rank is high and price is range-bound, so premium is rich
              relative to risk.{" "}
              <span className="text-muted-foreground">
                Probability of profit 68%, max loss capped at ₹6,200. Recommendation: enter, size at 2% of capital.&rdquo;
              </span>
            </blockquote>
            <div className="flex flex-wrap gap-2">
              <Button asChild>{authLink("/auth/sign-in", "Sign in", "Open Strategy Terminal")}</Button>
              {!isLoggedIn && (
                <Button asChild variant="outline">
                  {authLink("/auth/sign-up", "Create account")}
                </Button>
              )}
            </div>
          </Card>
        </Section>

        <Section
          id="insights"
          label="Insights"
          title="Real-time volatility intelligence and quant edge"
          lead="OptionPilot synthesizes implied volatility versus 30-day realized volatility, calculating statistical expected values and probability of profit across every liquid strike."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {INSIGHTS.map((m) => (
              <Card key={m.title} className="gap-2 px-6 py-6">
                <h3 className="text-lg font-semibold">{m.title}</h3>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          id="pricing"
          label="Pricing"
          title="Professional options tooling. Zero subscriptions."
          lead="Built for Indian retail traders to level the playing field against institutions. All defined-risk strategies, live NSE & BSE option chains, and quant modeling are completely free."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-6 px-6 py-6 ring-primary/40">
              <CardHeader className="gap-2 px-0">
                <div className="flex items-baseline justify-between gap-4">
                  <CardTitle className="text-xl font-semibold">Community Trader</CardTitle>
                  <span className="num text-2xl font-semibold">
                    ₹0 <span className="font-sans text-sm font-normal text-muted-foreground">/ forever</span>
                  </span>
                </div>
                <CardDescription>
                  Full access to the strategy terminal, live option chains, and all 12 defined-risk structures.
                </CardDescription>
              </CardHeader>
              <ul className="flex flex-1 flex-col gap-2 text-sm">
                {COMMUNITY_FEATURES.map((f) => (
                  <Feature key={f}>{f}</Feature>
                ))}
              </ul>
              <Button asChild size="lg" className="w-fit font-semibold">
                {authLink("/auth/sign-in", "Get Started Free")}
              </Button>
            </Card>

            <Card className="gap-6 px-6 py-6">
              <CardHeader className="gap-2 px-0">
                <div className="flex items-baseline justify-between gap-4">
                  <CardTitle className="text-xl font-semibold">Open Source &amp; Serverless</CardTitle>
                  <Badge variant="secondary" className="h-6 rounded-md px-2 font-normal">
                    MIT / Open
                  </Badge>
                </div>
                <CardDescription>
                  Built on Next.js, Neon Serverless PostgreSQL, and Upstox market APIs. Deployable anywhere.
                </CardDescription>
              </CardHeader>
              <ul className="flex flex-1 flex-col gap-2 text-sm">
                {OPEN_SOURCE_FEATURES.map((f) => (
                  <Feature key={f}>{f}</Feature>
                ))}
              </ul>
              <Button asChild size="lg" variant="outline" className="w-fit">
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  <GithubLogoIcon aria-hidden />
                  View on GitHub
                </a>
              </Button>
            </Card>
          </div>
        </Section>

        <Section id="faq" label="FAQ" title="Questions traders ask first">
          <Accordion type="single" collapsible defaultValue="0" className="max-w-[760px]">
            {FAQ.map((f, i) => (
              <AccordionItem key={f.q} value={String(i)}>
                <AccordionTrigger className="py-4 text-lg font-medium">{f.q}</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>
      </main>

      <footer className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t px-4 py-8 text-sm text-muted-foreground sm:px-8 lg:px-16">
        <Brand />
        <span>Educational tool. Not investment advice.</span>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground sm:ml-auto">
          GitHub
        </a>
      </footer>
    </div>
  );
}
