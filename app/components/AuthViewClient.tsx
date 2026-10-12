"use client";

import { AuthView } from "@neondatabase/auth-ui";

export default function AuthViewClient({ path }: { path: string }) {
  const redirectTo = path === "sign-out" ? "/" : "/dashboard";
  return <AuthView path={path} redirectTo={redirectTo} />;
}
