import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

export const ACCOUNT_SESSION_KEY = ["account", "session"] as const;
export const LINKED_ACCOUNTS_KEY = ["account", "linked"] as const;
export const SESSIONS_KEY = ["account", "sessions"] as const;
export const ORGANIZATIONS_KEY = ["account", "organizations"] as const;

/** The user with their avatar, and which session this device is. Settings reads it on every screen. */
export function useAccountSession() {
  const { account } = useAuth();
  return useQuery({ queryKey: ACCOUNT_SESSION_KEY, queryFn: () => account.session(), staleTime: 60_000 });
}

export function useLinkedAccounts() {
  const { account } = useAuth();
  return useQuery({ queryKey: LINKED_ACCOUNTS_KEY, queryFn: () => account.listAccounts() });
}

export function useSessions() {
  const { account } = useAuth();
  return useQuery({ queryKey: SESSIONS_KEY, queryFn: () => account.listSessions() });
}

export function useOrganizations() {
  const { account } = useAuth();
  return useQuery({ queryKey: ORGANIZATIONS_KEY, queryFn: () => account.listOrganizations() });
}
