import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { SignedOutError } from "@/lib/auth/errors";
import { ApiError } from "./client";
import { connectQueryManagers } from "./online";

/** Retry a failed read twice, but never when the server said no or the session is over. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof SignedOutError) return false;
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: shouldRetry, staleTime: 10_000 } } });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  useEffect(() => connectQueryManagers(), []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
