import { auth } from "@/lib/auth/server";
import LandingPage from "@/app/components/LandingPage";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Wrap in try/catch: a stale or corrupt session cookie (common in regular browsers
  // after a token refresh) should NOT crash the page — treat it as logged out instead.
  let session = null;
  try {
    const result = await auth.getSession();
    session = result.data;
  } catch {
    // Stale/invalid cookie — fall through and show the landing page
  }
  return <LandingPage isLoggedIn={!!session?.user} />;
}

