"use client";

import React, { createContext, useContext, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";

interface LoadingContextType {
  isLoading: boolean;
  statusText: string;
  showLoading: (text?: string) => void;
  hideLoading: () => void;
  navigateWithLoader: (href: string, text?: string, minDurationMs?: number) => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  statusText: "Loading...",
  showLoading: () => {},
  hideLoading: () => {},
  navigateWithLoader: () => {},
});

export function usePageTransition() {
  return useContext(LoadingContext);
}

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 2 22 12 12 22 2 12Z" />
      <path d="M12 7v10M7 12h10" />
    </svg>
  );
}

export function PageLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("Loading OptionPilot...");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const showLoading = useCallback((text = "Loading OptionPilot...") => {
    setStatusText(text);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const navigateWithLoader = useCallback(
    (href: string, text = "Loading OptionPilot...", minDurationMs = 650) => {
      setStatusText(text);
      setIsLoading(true);
      const startTime = Date.now();

      startTransition(() => {
        router.push(href);
      });

      const timer = setTimeout(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minDurationMs - elapsed);
        setTimeout(() => {
          setIsLoading(false);
        }, remaining);
      }, minDurationMs);

      return () => clearTimeout(timer);
    },
    [router]
  );

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        statusText,
        showLoading,
        hideLoading,
        navigateWithLoader,
      }}
    >
      {children}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#051a44]/95 backdrop-blur-md transition-opacity duration-300 select-none"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute h-96 w-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

          {/* Centered Mark with Rotating Halo */}
          <div className="relative flex items-center justify-center">
            {/* Outer spinning ring */}
            <div className="h-20 w-20 rounded-full border-2 border-sky-400/20 border-t-sky-400 border-r-sky-300 animate-spin" />

            {/* Glowing Logo Mark */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative animate-pulse">
                <Mark className="size-8 text-sky-200 drop-shadow-[0_0_16px_rgba(56,189,248,0.7)]" />
              </div>
            </div>
          </div>

          {/* Brand Name & Loading Message */}
          <div className="mt-6 flex flex-col items-center gap-1.5 text-center">
            <span className="font-sans text-[17px] font-semibold tracking-tight text-white">
              OptionPilot
            </span>
            <div className="flex items-center gap-2 text-xs font-mono text-sky-200/70 tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>{statusText}</span>
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}
