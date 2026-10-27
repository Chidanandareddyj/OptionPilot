import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";
import { readBearerHeader } from "@/lib/auth/bearer";

const sessionMiddleware = auth.middleware({
  loginUrl: "/",
});

export default function proxy(request: NextRequest) {
  // Bearer API calls authenticate in the route. Leaving them on the cookie
  // middleware would redirect /api/analyze to / before the route can return 401.
  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    readBearerHeader(request.headers.get("authorization")).present
  ) {
    return NextResponse.next();
  }
  return sessionMiddleware(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/analyze"],
};
