import AuthViewClient from "@/app/components/AuthViewClient";
import { RollingStrategyPill } from "@/app/components/MiniTerminalShowcase";
import { authViewPaths } from "@neondatabase/auth-ui/server";
import Link from "next/link";
import { OptionPilotLogo } from "@/app/components/OptionPilotLogo";

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
    <main className="relative min-h-screen flex flex-col justify-between bg-[#04173d] text-white overflow-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Ambient background glows matching landing page sky gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 inset-x-0 h-[480px] bg-gradient-to-b from-[#123a7e]/40 via-[#07245c]/25 to-transparent blur-2xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.12),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-[#020b1f] to-transparent" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-6 sm:pt-8 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[20px] font-semibold tracking-tight text-white hover:text-white/90 transition-colors group cursor-pointer"
        >
          <OptionPilotLogo variant="adaptive" className="size-7 text-white transition-transform duration-300 group-hover:scale-105" />
          <span className="font-sans font-bold">OptionPilot</span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Centered Auth Section */}
      <section className="relative z-10 w-full max-w-md mx-auto px-4 py-8 sm:py-10 flex flex-col items-center my-auto">
        {/* Live Market Real Index Ticker Pill */}
        <div className="w-full mb-4">
          <RollingStrategyPill />
        </div>

        {/* Single Slick Neon Auth Card */}
        <div className="w-full flex justify-center">
          <AuthViewClient path={path} />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-white/40 border-t border-white/5">
        OptionPilot © {new Date().getFullYear()}
      </footer>
    </main>
  );
}
