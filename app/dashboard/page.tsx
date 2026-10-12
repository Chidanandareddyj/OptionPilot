import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import AnalyzePanel from "./analyze-panel";
import DashboardHeader from "./header";
import DashboardBackground from "./dashboard-background";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Wrap in try/catch: a stale or corrupt session cookie should redirect to sign-in,
  // not crash the page with a Next.js cookies() error.
  let session = null;
  try {
    const result = await auth.getSession();
    session = result.data;
  } catch {
    // Stale/invalid cookie — redirect to landing page
  }
  if (!session?.user) {
    redirect("/");
  }

  const history = await prisma.analysis.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, company: true, result: true, decision: true, createdAt: true },
  });

  return (
    <main className="relative min-h-screen text-white">
      <DashboardBackground />
      <DashboardHeader name={session.user.name} />
      <AnalyzePanel history={history} />
    </main>
  );
}
