import AuthAppShell from "@/app/components/AuthAppShell";
import OrganizationViewClient from "@/app/components/OrganizationViewClient";
import { auth } from "@/lib/auth/server";
import { organizationViewPaths } from "@neondatabase/auth-ui/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(organizationViewPaths).map((path) => ({ path }));
}

export default async function OrganizationPage({
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
      <OrganizationViewClient path={path} />
    </AuthAppShell>
  );
}
