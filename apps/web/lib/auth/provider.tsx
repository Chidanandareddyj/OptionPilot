"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { usePageTransition } from "@/app/components/loading-overlay";
import { authClient } from "./client";

type ProviderSocialSignIn = NonNullable<
  NonNullable<ComponentProps<typeof NeonAuthUIProvider>["social"]>["signIn"]
>;

/** Subset of better-auth `signIn.social` params used by the Google button. */
type SocialSignInArgs = {
  provider: string;
  callbackURL?: string | null;
  newUserCallbackURL?: string | null;
  errorCallbackURL?: string | null;
};

type SocialClient = {
  signIn: { social: (args: Record<string, unknown>) => Promise<unknown> };
};

const DASHBOARD_PATH = "/dashboard";

function toAbsoluteUrl(value: string | null | undefined, fallback: string) {
  const target = value && value.length > 0 ? value : fallback;
  if (/^https?:\/\//i.test(target)) return target;
  return `${window.location.origin}${target.startsWith("/") ? target : `/${target}`}`;
}

/**
 * Custom social sign-in.
 *
 * The default UI button sends a *relative* `callbackURL` ("/dashboard") and no
 * `newUserCallbackURL`. The managed auth server lives on a different origin,
 * so relative URLs can't be resolved back to the app reliably — and new Google
 * users fell back to "/" (landing page) with no usable app session, while
 * returning users landed on "/dashboard".
 *
 * Sending absolute URLs for both `callbackURL` and `newUserCallbackURL`
 * makes the post-OAuth destination deterministic for sign-ups and sign-ins.
 */
async function socialSignIn(params: SocialSignInArgs): Promise<unknown> {
  const client = authClient as unknown as SocialClient;
  return client.signIn.social({
    provider: params.provider,
    callbackURL: toAbsoluteUrl(params.callbackURL, DASHBOARD_PATH),
    newUserCallbackURL: toAbsoluteUrl(DASHBOARD_PATH, DASHBOARD_PATH),
    errorCallbackURL: toAbsoluteUrl(
      `${window.location.pathname}${window.location.search}`,
      window.location.pathname,
    ),
    fetchOptions: { throw: true },
  });
}

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
  const { showLoading } = usePageTransition();

  return (
    <NeonAuthUIProvider
      authClient={authClient as ComponentProps<typeof NeonAuthUIProvider>["authClient"]}
      navigate={(href) => {
        if (
          typeof window !== "undefined" &&
          (window.location.pathname.includes("email-verification") ||
            window.location.pathname.includes("email-otp"))
        ) {
          window.dispatchEvent(
            new CustomEvent("optionpilot-email-verified", {
              detail: { nextUrl: "/auth/sign-in" },
            })
          );
          return;
        }
        showLoading(href.includes("dashboard") ? "Entering Strategy Terminal..." : "Loading OptionPilot...");
        router.push(href);
      }}
      replace={(href) => {
        if (
          typeof window !== "undefined" &&
          (window.location.pathname.includes("email-verification") ||
            window.location.pathname.includes("email-otp"))
        ) {
          window.dispatchEvent(
            new CustomEvent("optionpilot-email-verified", {
              detail: { nextUrl: "/auth/sign-in" },
            })
          );
          return;
        }
        showLoading(href.includes("dashboard") ? "Entering Strategy Terminal..." : "Loading OptionPilot...");
        router.replace(href);
      }}
      onSessionChange={() => router.refresh()}
      Link={AuthLink}
      redirectTo="/dashboard"
      defaultTheme="dark"
      social={{ providers: ["google"], signIn: socialSignIn as ProviderSocialSignIn }}
      credentials={{ confirmPassword: true }}
      emailVerification={{ otp: true }}
      localization={{
        SIGN_UP_ACTION: "Next",
        EMAIL_VERIFICATION_DESCRIPTION: "Please enter the OTP sent to your email",
        EMAIL_VERIFICATION_SUCCESS:
          "Email verified successfully! Welcome to OptionPilot. Please sign in to access your dashboard.",
      }}
      avatar
      organization
    >
      {children}
    </NeonAuthUIProvider>
  );
}
