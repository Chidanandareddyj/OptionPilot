import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { authViewPaths } from "@neondatabase/auth-ui/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import AuthViewClient from "@/app/components/AuthViewClient";
import { MarketTicker } from "@/app/components/market-ticker";
import { PayoffFigure } from "@/app/components/payoff-figure";
import { PillLink, PillNav } from "@/app/components/pill-nav";
import { ThemeToggle } from "@/app/components/theme-toggle";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <div className="min-h-screen bg-background">
      <PillNav>
        <PillLink asChild>
          <Link href="/">
            <ArrowLeftIcon aria-hidden className="size-4" />
            Back to home
          </Link>
        </PillLink>
        <ThemeToggle />
      </PillNav>
      <main className="grid min-h-screen items-center gap-16 px-4 pt-24 pb-16 lg:grid-cols-2 lg:pt-16">
        <div className="flex justify-center">
          <AuthViewClient path={path} />
        </div>
        <Card className="justify-center gap-4 p-8 max-lg:hidden lg:min-h-[640px]">
          <div className="flex flex-col gap-2 px-2">
            <Badge variant="secondary" className="h-6 rounded-md bg-accent px-2 font-normal text-muted-foreground">
              Fig. 1 · Bull call spread, illustrative
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight">See the worst case first, then decide.</h2>
          </div>
          <div className="rounded-lg bg-background px-2 pt-2">
            <PayoffFigure height={380} />
          </div>
          <MarketTicker className="px-2" />
        </Card>
      </main>
    </div>
  );
}
