import { auth } from "@/lib/auth/server";
import LandingPage from "@/app/components/LandingPage";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: session } = await auth.getSession();
  if (session?.user) {
    redirect("/dashboard");
  }
  return <LandingPage />;
}
