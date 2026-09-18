"use client";

import { AuthView } from "@neondatabase/auth-ui";

export default function AuthViewClient({ path }: { path: string }) {
  return <AuthView path={path} />;
}
