import { auth } from "@/lib/auth/server";
import LandingPage from "@/app/components/LandingPage";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: session } = await auth.getSession();
  // Authenticated users belong in the app. Without this, a post-OAuth
  // redirect that lands on "/" strands a logged-in user on the landing page.
  if (session?.user) {
    redirect("/dashboard");
  }
  return <LandingPage />;
}
