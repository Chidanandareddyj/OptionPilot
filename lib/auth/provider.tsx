"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { authClient } from "./client";

function AuthLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <NeonAuthUIProvider
      authClient={authClient as ComponentProps<typeof NeonAuthUIProvider>["authClient"]}
      navigate={(href) => router.push(href)}
      replace={(href) => router.replace(href)}
      onSessionChange={() => router.refresh()}
      Link={AuthLink}
      redirectTo="/dashboard"
    >
      {children}
    </NeonAuthUIProvider>
  );
}
