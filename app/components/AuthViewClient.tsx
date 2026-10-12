"use client";

import { useEffect, useRef } from "react";
import { AuthView } from "@neondatabase/auth-ui";

const EYE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 shrink-0 pointer-events-none"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;

const EYE_OFF_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 shrink-0 pointer-events-none"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499A10.75 10.75 0 0 1 2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 2.89-4.134"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;

export default function AuthViewClient({ path }: { path: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const redirectTo = path === "sign-out" ? "/" : "/dashboard";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const setupPasswordToggles = () => {
      const inputs = container.querySelectorAll<HTMLInputElement>(
        'input[type="password"], input[data-auth-password="true"]'
      );

      inputs.forEach((input) => {
        const parent = input.parentElement;
        if (!parent) return;

        // If the parent already contains our toggle button or another button, skip
        if (parent.querySelector("button[data-password-toggle]")) return;
        if (parent.querySelector("button")) return;

        input.setAttribute("data-auth-password", "true");
        input.classList.add("pr-10", "hide-password-toggle");
        if (!parent.classList.contains("relative")) {
          parent.classList.add("relative");
        }

        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("data-password-toggle", "true");
        btn.setAttribute("tabindex", "-1");
        btn.className =
          "!bg-transparent absolute top-0 right-0 h-9 w-9 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md outline-none focus-visible:ring-1 focus-visible:ring-ring";

        const updateState = () => {
          const isShown = input.type === "text";
          btn.innerHTML = isShown ? EYE_SVG : EYE_OFF_SVG;
          btn.setAttribute("aria-label", isShown ? "Hide password" : "Show password");
          btn.setAttribute("title", isShown ? "Hide password" : "Show password");
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

        parent.appendChild(btn);
      });
    };

    setupPasswordToggles();

    const observer = new MutationObserver(() => {
      setupPasswordToggles();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <style>{`
        .hide-password-toggle::-ms-reveal,
        .hide-password-toggle::-ms-clear {
          visibility: hidden;
          pointer-events: none;
          display: none;
        }
      `}</style>
      <AuthView path={path} redirectTo={redirectTo} />
    </div>
  );
}

