import { ArrowLeftIcon, ChartLineUpIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PayoffChart } from "./components/payoff-chart";
import { PillNav } from "./components/pill-nav";
import { ThemeToggle } from "./components/theme-toggle";

// A flat line at zero: nothing gained, nothing lost.
const FLAT = Array.from({ length: 11 }, (_, i) => ({ price: i * 10, pnl: 0 }));

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <PillNav>
        <ThemeToggle />
      </PillNav>
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-4 pt-24 pb-16">
        <div className="flex flex-col gap-4">
          <span className="text-sm text-muted-foreground">Error 404</span>
          <h1 className="hero-grad text-8xl font-semibold tracking-tighter">404</h1>
          <p className="text-2xl font-semibold tracking-tight">This page is out of the money.</p>
          <p className="max-w-md text-muted-foreground">The address does not match any page. It may have moved, or the link may be mistyped.</p>
        </div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <PayoffChart illustrative points={FLAT} maxProfit={null} maxLoss={null} height={160} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="lg" className="font-semibold">
            <Link href="/">
              <ArrowLeftIcon aria-hidden />
              Back to home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard">
              <ChartLineUpIcon aria-hidden />
              Open the terminal
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
