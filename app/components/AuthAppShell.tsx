import Link from "next/link";
import { AppShell } from "./app-shell";
import type { ShellUser } from "./avatar-menu";

export type SettingsTab = "settings" | "security" | "organizations";

const TABS: { id: SettingsTab; label: string; href: string }[] = [
  { id: "settings", label: "Account", href: "/account/settings" },
  { id: "security", label: "Security", href: "/account/security" },
  { id: "organizations", label: "Organizations", href: "/account/organizations" },
];

export const SETTINGS_CHIP =
  "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground";

export function SettingsHeader({ active }: { active?: SettingsTab }) {
  return (
    <>
      <header className="flex flex-col gap-1 px-2">
        <span className="text-sm text-muted-foreground">Account</span>
        <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
      </header>
      <nav aria-label="Settings sections" className="flex flex-wrap gap-2 px-2 pt-2">
        {TABS.map((t) => (
          <Link key={t.id} href={t.href} aria-current={t.id === active ? "page" : undefined} className={SETTINGS_CHIP}>
            {t.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

export default function AuthAppShell({
  user,
  active,
  children,
}: {
  user: ShellUser;
  active?: SettingsTab;
  children: React.ReactNode;
}) {
  return (
    <AppShell active="settings" user={user}>
      <div className="flex flex-col gap-4">
        <SettingsHeader active={active} />
        <div className="settings-view max-w-[760px]">{children}</div>
      </div>
    </AppShell>
  );
}
