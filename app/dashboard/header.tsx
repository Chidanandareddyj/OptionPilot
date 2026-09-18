"use client";

import { UserButton } from "@neondatabase/auth-ui";

export default function DashboardHeader({ name }: { name?: string | null }) {
  return (
    <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/45">
          Dashboard
        </p>
        <h1 className="font-serif text-[28px] leading-tight">
          Analyze{name ? `, ${name}` : ""}
        </h1>
      </div>
      <UserButton />
    </header>
  );
}
