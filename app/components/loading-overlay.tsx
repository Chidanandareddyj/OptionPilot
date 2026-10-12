"use client";

import React, {
  createContext,
  useContext,
  useState,
  useTransition,
  useCallback,
  useEffect,
  useRef,
  Suspense,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import LoadingScreen from "./LoadingScreen";

interface LoadingContextType {
  isLoading: boolean;
  statusText: string;
  showLoading: (text?: string) => void;
  hideLoading: () => void;
  navigateWithLoader: (href: string, text?: string, minDurationMs?: number) => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  statusText: "Loading OptionPilot...",
  showLoading: () => {},
  hideLoading: () => {},
  navigateWithLoader: () => {},
});

export function usePageTransition() {
  return useContext(LoadingContext);
}

function RouteChangeListener({
  onRouteChange,
}: {
  onRouteChange: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    const fullPath = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
    if (lastPathRef.current !== null && lastPathRef.current !== fullPath) {
      onRouteChange();
    }
    lastPathRef.current = fullPath;
  }, [pathname, searchParams, onRouteChange]);

  return null;
}

export function PageLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("Loading OptionPilot...");
  const startTimeRef = useRef<number>(0);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const showLoading = useCallback((text = "Loading OptionPilot...") => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    startTimeRef.current = Date.now();
    setStatusText(text);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleRouteComplete = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, 300 - elapsed);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setIsLoading(false);
    }, remaining);
  }, []);

  const navigateWithLoader = useCallback(
    (href: string, text = "Loading OptionPilot...", minDurationMs = 350) => {
      showLoading(text);
      startTransition(() => {
        router.push(href);
      });

      const timer = setTimeout(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, minDurationMs - elapsed);
        hideTimerRef.current = setTimeout(() => {
          setIsLoading(false);
        }, remaining);
      }, minDurationMs);

      return () => clearTimeout(timer);
    },
    [router, showLoading]
  );

  // Global listener for link clicks & browser back/forward navigation
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const target = (e.target as HTMLElement | null)?.closest?.("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore non-navigation links
      if (
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        target.getAttribute("target") === "_blank" ||
        target.getAttribute("download") !== null
      ) {
        return;
      }

      // Ignore pure hash anchors on the same page
      if (href.startsWith("#")) {
        return;
      }

      try {
        const nextUrl = new URL(href, window.location.href);
        const currUrl = new URL(window.location.href);

        // Ignore external hosts
        if (nextUrl.origin !== currUrl.origin) {
          return;
        }

        // If pathname and search are identical, it's just an in-page anchor jump
        if (nextUrl.pathname === currUrl.pathname && nextUrl.search === currUrl.search) {
          return;
        }

        let message = "Loading OptionPilot...";
        if (nextUrl.pathname.startsWith("/dashboard")) {
          message = "Entering Strategy Terminal...";
        } else if (nextUrl.pathname.startsWith("/auth/sign-in")) {
          message = "Opening Sign In...";
        } else if (nextUrl.pathname.startsWith("/auth/sign-up")) {
          message = "Opening Sign Up...";
        } else if (nextUrl.pathname.startsWith("/account")) {
          message = "Loading Account...";
        } else if (nextUrl.pathname.startsWith("/organization")) {
          message = "Loading Organization...";
        }

        showLoading(message);
      } catch {
        // Ignore invalid URLs
      }
    };

    const handlePopState = () => {
      showLoading("Loading OptionPilot...");
    };

    const handleBeforeUnload = () => {
      setIsLoading(true);
    };

    document.addEventListener("click", handleAnchorClick, true);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [showLoading]);

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
      <Suspense fallback={null}>
        <RouteChangeListener onRouteChange={handleRouteComplete} />
      </Suspense>
      {children}
      {isLoading && <LoadingScreen statusText={statusText} />}
    </LoadingContext.Provider>
  );
}
