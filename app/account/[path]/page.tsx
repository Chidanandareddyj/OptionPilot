import AccountViewClient from "@/app/components/AccountViewClient";
import AuthAppShell from "@/app/components/AuthAppShell";
import { auth } from "@/lib/auth/server";
import { accountViewPaths } from "@neondatabase/auth-ui/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { path } = await params;

  return (
    <AuthAppShell name={session.user.name}>
      <AccountViewClient path={path} />
    </AuthAppShell>
  );
}
