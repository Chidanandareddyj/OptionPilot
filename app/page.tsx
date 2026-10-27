import { auth } from "@/lib/auth/server";
import LandingPage from "@/app/components/LandingPage";

export const dynamic = "force-dynamic";

export default async function Home() {
  let session = null;
  try {
    const result = await auth.getSession();
    session = result.data;
  } catch {
  }
  return <LandingPage isLoggedIn={!!session?.user} />;
}

