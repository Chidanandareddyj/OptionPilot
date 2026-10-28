import { createNeonAuth } from "@neondatabase/auth/next/server";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || "https://placeholder.neonauth.tech",
  cookies: {
    secret:
      process.env.NEON_AUTH_COOKIE_SECRET ||
      "placeholder_cookie_secret_at_least_32_characters_long",
  },
});
