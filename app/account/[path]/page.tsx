import AccountViewClient from "@/app/components/AccountViewClient";
import AuthAppShell, { type SettingsTab } from "@/app/components/AuthAppShell";
import { auth } from "@/lib/auth/server";
import { accountViewPaths } from "@neondatabase/auth-ui/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}

const TAB_PATHS: string[] = ["settings", "security", "organizations"] satisfies SettingsTab[];

export default async function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/");
  }

  const { path } = await params;
  const { name, email, image } = session.user;

  return (
    <AuthAppShell user={{ name, email, image }} active={TAB_PATHS.includes(path) ? (path as SettingsTab) : undefined}>
      <AccountViewClient path={path} />
    </AuthAppShell>
  );
}
