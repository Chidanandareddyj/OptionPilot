import AuthViewClient from "@/app/components/AuthViewClient";
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#061f52] p-4">
      <Link
        href="/"
        className="mb-6 flex items-center gap-2.5 text-[20px] font-semibold tracking-tight text-white/90 hover:text-white transition-colors cursor-pointer"
      >
        <OptionPilotLogo variant="adaptive" className="size-7 text-white" />
        <span>OptionPilot</span>
      </Link>
      <AuthViewClient path={path} />
    </main>
  );
}

