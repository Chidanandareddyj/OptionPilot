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
    redirect("/");
  }

  const { path } = await params;
  const { name, email, image } = session.user;

  return (
    <AuthAppShell user={{ name, email, image }} active="organizations">
      <OrganizationViewClient path={path} />
    </AuthAppShell>
  );
}
