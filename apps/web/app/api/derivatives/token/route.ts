import { createHmac } from "node:crypto";
import { requireUserId, UnauthorizedError } from "@optionpilot/shared";
import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TTL_MS = 60_000;

// Mints "<expiryMs>.<hmac>" for the relay's /stream endpoint (see relay/server.mjs validToken).
export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    requireUserId(session);

    const secret = process.env.RELAY_SECRET;
    const url = process.env.NEXT_PUBLIC_RELAY_URL;
    if (!secret || !url) {
      return NextResponse.json({ error: "Live feed is not configured" }, { status: 503 });
    }

    const exp = String(Date.now() + TTL_MS);
    const sig = createHmac("sha256", secret).update(exp).digest("hex");
    return NextResponse.json({ url, token: `${exp}.${sig}` });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[/api/derivatives/token error]:", error);
    return NextResponse.json({ error: "Token error" }, { status: 500 });
  }
}
