import DashboardBackground from "@/app/dashboard/dashboard-background";
import DashboardHeader from "@/app/dashboard/header";

export default function AuthAppShell({
  name,
  children,
}: {
  name?: string | null;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen text-white">
      <DashboardBackground />
      <DashboardHeader name={name} />
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">{children}</div>
    </main>
  );
}
