import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import AnalyzePanel from "./analyze-panel";
import DashboardHeader from "./header";
import DashboardBackground from "./dashboard-background";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const history = await prisma.analysis.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      company: true,
      result: true,
      createdAt: true,
    },
  });

  return (
    <main className="relative min-h-screen text-white">
      <DashboardBackground />
      <DashboardHeader name={session.user.name} />
      <AnalyzePanel
        history={history.map((row) => ({
          id: row.id,
          company: row.company,
          createdAt: row.createdAt.toISOString(),
          result: row.result,
        }))}
      />
    </main>
  );
}
