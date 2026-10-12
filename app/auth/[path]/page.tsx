import AuthViewClient from "@/app/components/AuthViewClient";
import { authViewPaths } from "@neondatabase/auth-ui/server";
import Link from "next/link";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 2 22 12 12 22 2 12Z" />
      <path d="M12 7v10M7 12h10" />
    </svg>
  );
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
        <Mark className="size-6 text-sky-400" />
        <span>OptionPilot</span>
      </Link>
      <AuthViewClient path={path} />
    </main>
  );
}

