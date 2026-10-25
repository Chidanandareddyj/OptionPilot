"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { AuthView } from "@neondatabase/auth-ui";
import { useRouter } from "next/navigation";
import { usePageTransition } from "@/app/components/loading-overlay";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

const EYE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;pointer-events:none"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;

const EYE_OFF_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;pointer-events:none"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499A10.75 10.75 0 0 1 2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 2.89-4.134"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;

const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block"><polyline points="20 6 9 17 4 12"/></svg>`;

const CROSS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

const isOurToggle = (el: Element) => el.hasAttribute("data-password-toggle");

/**
 * Detects the auth UI's own show/hide button. It usually contains an icon AND a
 * visually hidden label (<span class="sr-only">Show password</span>), so we can't
 * require it to be text-free. A submit button ("Sign in", "Next") never matches
 * because its label has no show/hide/toggle wording.
 */
const looksLikeBuiltInToggle = (b: HTMLButtonElement) => {
  if (isOurToggle(b) || !b.querySelector("svg")) return false;
  if (b.getAttribute("type") === "submit") return false;
  const label = `${b.textContent ?? ""} ${b.getAttribute("aria-label") ?? ""} ${b.getAttribute("title") ?? ""}`
    .trim()
    .toLowerCase();
  return label === "" || /(show|hide|toggle|reveal|visib)/.test(label);
};

/**
 * Finds the smallest ancestor that "belongs" to a single field, i.e. climbs up
 * from the input until the next level would contain a second <input>.
 * This keeps the toggle lookup scoped to ONE field (so the Password field's
 * toggle is never mistaken for the Confirm Password field's toggle).
 */
const getFieldRoot = (input: HTMLInputElement, container: HTMLElement): HTMLElement => {
  let root: HTMLElement = input.parentElement ?? container;
  let node: HTMLElement | null = root.parentElement;
  let hops = 0;

  while (node && node !== container && hops < 3) {
    if (node.querySelectorAll("input").length > 1) break;
    root = node;
    node = node.parentElement;
    hops++;
  }
  return root;
};

export default function AuthViewClient({ path }: { path: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { showLoading } = usePageTransition();

  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const redirectTo = path === "sign-out" ? "/" : "/dashboard";

  // Listen for the custom email-verified event from provider navigate handler
  useEffect(() => {
    const handleEmailVerified = () => {
      setShowVerifiedModal(true);
      setCountdown(3);
    };

    window.addEventListener("optionpilot-email-verified", handleEmailVerified);
    return () => {
      window.removeEventListener("optionpilot-email-verified", handleEmailVerified);
    };
  }, []);

  // Countdown timer for automatic redirect
  useEffect(() => {
    if (!showVerifiedModal) return;

    if (countdown <= 0) {
      showLoading("Loading OptionPilot...");
      router.push("/auth/sign-in");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showVerifiedModal, countdown, router, showLoading]);

  // DOM enhancers for Password Toggles, Confirm Password real-time validation, and Next button
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const setupEnhancements = () => {
      // 1. Password Visibility Toggle: exactly ONE toggle per password field
      const inputs = container.querySelectorAll<HTMLInputElement>(
        'input[type="password"], input[data-auth-password="true"]'
      );

      inputs.forEach((input) => {
        // Mark every password input so we can still find it after its type becomes "text"
        input.setAttribute("data-auth-password", "true");

        const root = getFieldRoot(input, container);

        // Built-in toggle from the auth UI: an icon-only button (svg, no text) that isn't ours
        const builtInBtn = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
          looksLikeBuiltInToggle
        );

        if (builtInBtn) {
          // Built-in exists -> remove all of OUR toggles in this field
          root.querySelectorAll("button[data-password-toggle]").forEach((b) => b.remove());

          // Unwrap our wrapper (if we added one earlier) and restore the input's styles
          const wrapperEl = input.parentElement;
          if (wrapperEl && wrapperEl.getAttribute("data-password-wrapper") === "true") {
            wrapperEl.parentElement?.insertBefore(input, wrapperEl);
            wrapperEl.remove();
            input.style.paddingRight = "";
            input.style.width = "";
            input.style.margin = "";
          }

          builtInBtn.removeAttribute("disabled");
          builtInBtn.style.opacity = "1";
          builtInBtn.style.pointerEvents = "auto";
          builtInBtn.style.cursor = "pointer";
          return;
        }

        // No built-in toggle (e.g. Sign In form). Dedupe any extra custom toggles first.
        const customBtns = root.querySelectorAll("button[data-password-toggle]");
        if (customBtns.length > 1) {
          customBtns.forEach((b, i) => {
            if (i > 0) b.remove();
          });
        }
        if (customBtns.length >= 1) return;

        const parent = input.parentElement;
        if (!parent) return;
        if (parent.getAttribute("data-password-wrapper") === "true") {
          // Wrapper exists without a button (shouldn't happen) -> don't wrap twice
          return;
        }

        input.classList.add("hide-password-toggle");
        input.style.paddingRight = "40px";
        input.style.width = "100%";
        input.style.margin = "0";

        const wrapper = document.createElement("div");
        wrapper.setAttribute("data-password-wrapper", "true");
        wrapper.style.cssText =
          "position:relative;display:flex;align-items:center;width:100%;";

        parent.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("data-password-toggle", "true");
        btn.setAttribute("tabindex", "-1");
        btn.style.cssText = [
          "position:absolute",
          "right:6px",
          "top:0",
          "bottom:0",
          "margin:auto 0",
          "height:28px",
          "width:28px",
          "padding:0",
          "display:inline-flex",
          "align-items:center",
          "justify-content:center",
          "background:transparent",
          "border:0",
          "outline:none",
          "cursor:pointer",
          "color:var(--muted-foreground)",
          "z-index:30",
        ].join(";");

        btn.addEventListener("mouseenter", () => (btn.style.color = "var(--foreground)"));
        btn.addEventListener("mouseleave", () => (btn.style.color = "var(--muted-foreground)"));

        const updateState = () => {
          const isShown = input.type === "text";
          btn.innerHTML = isShown ? EYE_SVG : EYE_OFF_SVG;
          btn.setAttribute("aria-label", isShown ? "Hide password" : "Show password");
        };

        updateState();

        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          input.type = input.type === "password" ? "text" : "password";
          updateState();
          try {
            const len = input.value.length;
            input.setSelectionRange(len, len);
          } catch {
            // ignore
          }
        });

        wrapper.appendChild(btn);
      });

      // 2. Button text update on Sign-Up page: ensure primary submit says "Next", prune redundant buttons, and handle OTP flow
      if (path === "sign-up") {
        const submitBtn = container.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (submitBtn) {
          const text = submitBtn.textContent?.trim().toLowerCase();
          if (text && !text.includes("next") && (text.includes("account") || text.includes("sign up"))) {
            const spinner = submitBtn.querySelector("svg");
            submitBtn.textContent = "Next";
            if (spinner) submitBtn.prepend(spinner);
          }
        }

        // Remove any "Sign in with Email" / "Email Code" button from the Sign-Up view
        const buttons = container.querySelectorAll<HTMLButtonElement>("button");
        buttons.forEach((btn) => {
          if (btn.type === "submit") return;
          const text = btn.textContent?.trim().toLowerCase() || "";
          if (
            text.includes("sign in with") ||
            text.includes("email code") ||
            text.includes("email otp") ||
            btn.querySelector("svg.lucide-mail")
          ) {
            btn.remove();
          }
        });

        // Intercept sign-up form submit: validate, create account, dispatch OTP, and route to verification
        const form = container.querySelector<HTMLFormElement>("form");
        if (form && !form.hasAttribute("data-signup-flow-handler")) {
          form.setAttribute("data-signup-flow-handler", "true");
          form.addEventListener(
            "submit",
            async (e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();

              const nameInput = form.querySelector<HTMLInputElement>('input[name="name"]');
              const emailInput = form.querySelector<HTMLInputElement>(
                'input[name="email"], input[type="email"]'
              );
              const passwordInput = form.querySelector<HTMLInputElement>('input[name="password"]');
              const confirmInput = form.querySelector<HTMLInputElement>(
                'input[name="confirmPassword"]'
              );
              const activeSubmitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');

              const name = nameInput?.value.trim() || "";
              const email = emailInput?.value.trim() || "";
              const password = passwordInput?.value || "";
              const confirmPassword = confirmInput?.value || "";

              let errorEl = form.querySelector<HTMLDivElement>("[data-signup-custom-error]");
              if (!errorEl) {
                errorEl = document.createElement("div");
                errorEl.setAttribute("data-signup-custom-error", "true");
                errorEl.style.cssText =
                  "padding:8px 12px;border-radius:8px;background:var(--card);border:1px solid var(--destructive);color:var(--destructive);font-size:0.875rem;margin-bottom:12px;line-height:1.4;";
                form.insertBefore(errorEl, form.firstChild);
              }

              const showError = (msg: string) => {
                if (errorEl) {
                  errorEl.textContent = msg;
                  errorEl.style.display = "block";
                }
              };

              const clearError = () => {
                if (errorEl) {
                  errorEl.textContent = "";
                  errorEl.style.display = "none";
                }
              };

              clearError();

              if (!name) {
                showError("Please enter your name");
                nameInput?.focus();
                return;
              }
              if (!email || !email.includes("@")) {
                showError("Please enter a valid email address");
                emailInput?.focus();
                return;
              }
              if (!password || password.length < 8) {
                showError("Password must be at least 8 characters");
                passwordInput?.focus();
                return;
              }
              if (confirmInput && password !== confirmPassword) {
                showError("Passwords do not match");
                confirmInput?.focus();
                return;
              }

              const originalBtnText = activeSubmitBtn?.innerHTML || "Next";
              if (activeSubmitBtn) {
                activeSubmitBtn.disabled = true;
                activeSubmitBtn.innerHTML = `
                  <span style="display:inline-flex;align-items:center;gap:8px;">
                    <svg style="animation:spin 1s linear infinite;width:16px;height:16px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle style="opacity:0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path style="opacity:0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending verification code...
                  </span>
                `;
              }

              try {
                // 1. Create account
                const res = await (authClient.signUp.email as any)({
                  email,
                  password,
                  name,
                });

                if (res?.error) {
                  showError(res.error.message || "Sign up failed. Please try again.");
                  if (activeSubmitBtn) {
                    activeSubmitBtn.disabled = false;
                    activeSubmitBtn.innerHTML = originalBtnText;
                  }
                  return;
                }

                // 2. Dispatch Email OTP verification
                try {
                  if ((authClient as any).emailOtp?.sendVerificationOtp) {
                    await (authClient as any).emailOtp.sendVerificationOtp({
                      email,
                      type: "email-verification",
                    });
                  }
                } catch (otpErr) {
                  console.warn("sendVerificationOtp notice:", otpErr);
                }

                // 3. Clear any session automatically opened so unverified users must verify OTP first
                try {
                  await authClient.signOut();
                } catch {}

                // 4. Smoothly route directly to the OTP verification page
                showLoading("Entering verification screen...");
                router.push(`/auth/email-verification?email=${encodeURIComponent(email)}`);
              } catch (err: any) {
                showError(err?.message || "An unexpected error occurred during sign up.");
                if (activeSubmitBtn) {
                  activeSubmitBtn.disabled = false;
                  activeSubmitBtn.innerHTML = originalBtnText;
                }
              }
            },
            true
          );
        }
      }

      // 3. Confirm Password real-time matching indicator
      const confirmInput = container.querySelector<HTMLInputElement>('input[name="confirmPassword"]');
      const passwordInput = container.querySelector<HTMLInputElement>(
        'input[name="password"], input[autocomplete="new-password"]:not([name="confirmPassword"])'
      );

      if (confirmInput && passwordInput) {
        const confirmWrapper = confirmInput.closest(".relative") || confirmInput.parentElement;
        if (confirmWrapper && confirmWrapper.parentElement) {
          const existingFeedback = confirmWrapper.parentElement.querySelector<HTMLDivElement>(
            "[data-confirm-match-status]"
          );

          let created: HTMLDivElement | null = null;
          if (!existingFeedback) {
            created = document.createElement("div");
            created.setAttribute("data-confirm-match-status", "true");
            created.style.cssText =
              "margin-top:6px;font-size:0.75rem;font-weight:500;display:flex;align-items:center;gap:5px;transition:all 0.15s ease;";
            confirmWrapper.parentElement.appendChild(created);
          }
          const feedback = (existingFeedback ?? created) as HTMLDivElement;

          const updateMatchState = () => {
            const confirmVal = confirmInput.value;
            const passVal = passwordInput.value;

            if (!confirmVal) {
              feedback.innerHTML = "";
              feedback.style.display = "none";
              confirmInput.style.borderColor = "";
              return;
            }

            feedback.style.display = "flex";
            if (confirmVal === passVal) {
              feedback.innerHTML = `${CHECK_SVG} <span>Passwords match</span>`;
              feedback.style.color = "var(--profit)";
              confirmInput.style.borderColor = "var(--profit)";
            } else {
              feedback.innerHTML = `${CROSS_SVG} <span>Passwords do not match</span>`;
              feedback.style.color = "var(--loss)";
              confirmInput.style.borderColor = "var(--loss)";
            }
          };

          if (!confirmInput.hasAttribute("data-match-listener")) {
            confirmInput.setAttribute("data-match-listener", "true");
            confirmInput.addEventListener("input", updateMatchState);
            passwordInput.addEventListener("input", updateMatchState);
          }
        }
      }

      // 4. Verification prompt text and OTP input cleanup on email-verification page
      if (path === "email-verification" || path === "email-otp") {
        const desc = container.querySelector<HTMLElement>(
          '[data-slot="card-description"], .text-muted-foreground'
        );
        if (desc && !desc.getAttribute("data-verified-updated")) {
          desc.setAttribute("data-verified-updated", "true");
          desc.textContent = "Please enter the OTP sent to your email";
        }

        // Ensure internal input-otp raw text is completely transparent and does not overlap slots
        const otpInputs = container.querySelectorAll<HTMLInputElement>(
          'input[data-input-otp], [data-slot="input-otp"] input, input[autocomplete="one-time-code"]'
        );
        otpInputs.forEach((inp) => {
          inp.style.setProperty("color", "transparent", "important");
          inp.style.setProperty("background", "transparent", "important");
          inp.style.setProperty("caret-color", "transparent", "important");
          inp.style.setProperty("border", "none", "important");
          inp.style.setProperty("box-shadow", "none", "important");
          inp.style.setProperty("outline", "none", "important");
        });
      }
    };

    setupEnhancements();

    const observer = new MutationObserver(() => setupEnhancements());
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [path]);

  return (
    <div ref={containerRef} className="auth-form relative flex w-full justify-center">
      <AuthView path={path} redirectTo={redirectTo} />

      {showVerifiedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-verified-title"
            className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-popover p-6 text-center ring-1 ring-foreground/10"
          >
            <CheckCircleIcon aria-hidden weight="fill" className="size-12 text-profit" />
            <div className="flex flex-col gap-2">
              <h3 id="email-verified-title" className="text-xl font-semibold tracking-tight">
                Email verified
              </h3>
              <p className="text-sm text-muted-foreground">
                Welcome to OptionPilot. Please sign in to access your dashboard.
              </p>
            </div>
            <p role="status" className="num text-xs text-muted-foreground">
              Redirecting to sign in in {countdown}s
            </p>
            <Button
              size="lg"
              className="w-full font-semibold"
              onClick={() => {
                showLoading("Loading OptionPilot...");
                router.push("/auth/sign-in");
              }}
            >
              Go to sign in now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
