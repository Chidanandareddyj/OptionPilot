import { UnauthorizedError } from "@optionpilot/shared";

/** What deleting an account needs from the outside. Tests pass fakes. */
export type DeleteAccountDeps = {
  /** Signed-in user id from the bearer JWT or the session cookie. Throws UnauthorizedError. */
  getUserId: (request: Request) => Promise<string>;
  /** Hard-deletes every saved analysis of this user and returns how many rows went. */
  deleteAnalyses: (userId: string) => Promise<number>;
  /** Removes this user's push tokens so a deleted account gets no further alerts. */
  deleteDevices: (userId: string) => Promise<number>;
  /** Removes the Neon Auth user. Returns false when this deployment cannot do it. */
  deleteAuthUser: (userId: string) => Promise<boolean>;
};

export type DeleteAccountResult = {
  analysesDeleted: number;
  /** False means the login still exists and the caller has to remove it another way. */
  authUserDeleted: boolean;
};

export type NeonAdminConfig = { apiKey: string; projectId: string; branchId: string };

/** Reads the Neon API settings. Null unless all three are set, so a half-configured deploy is not used. */
export function readNeonAdminConfig(env: Record<string, string | undefined>): NeonAdminConfig | null {
  const apiKey = env.NEON_API_KEY?.trim();
  const projectId = env.NEON_PROJECT_ID?.trim();
  const branchId = env.NEON_BRANCH_ID?.trim();
  return apiKey && projectId && branchId ? { apiKey, projectId, branchId } : null;
}

/**
 * Deletes one user with Neon's "Delete auth user" endpoint (documented at
 * https://neon.com/docs/reference/api/auth/delete-branch-neon-auth-user).
 * A 404 counts as success: the user is already gone, which is what was asked for.
 */
export function createNeonAuthUserDeleter(
  config: NeonAdminConfig | null,
  fetchImpl: typeof fetch = fetch,
): DeleteAccountDeps["deleteAuthUser"] {
  return async (userId) => {
    if (!config) return false;
    const url =
      `https://console.neon.tech/api/v2/projects/${encodeURIComponent(config.projectId)}` +
      `/branches/${encodeURIComponent(config.branchId)}/auth/users/${encodeURIComponent(userId)}`;
    try {
      const response = await fetchImpl(url, {
        method: "DELETE",
        headers: { authorization: `Bearer ${config.apiKey}`, accept: "application/json" },
      });
      return response.ok || response.status === 404;
    } catch {
      return false;
    }
  };
}

/**
 * `DELETE /api/account`. It acts on the caller's own id only: there is no id in the request, so one
 * user cannot name another. The analyses go first, so a failure later never leaves data behind a
 * deleted login.
 */
export function createDeleteAccountHandler(deps: DeleteAccountDeps) {
  return async function handle(request: Request): Promise<Response> {
    try {
      const userId = await deps.getUserId(request);
      const analysesDeleted = await deps.deleteAnalyses(userId);
      await deps.deleteDevices(userId);
      const authUserDeleted = await deps.deleteAuthUser(userId).catch(() => false);
      const body: DeleteAccountResult = { analysesDeleted, authUserDeleted };
      return Response.json(body);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      console.error("[/api/account delete error]:", error);
      return Response.json({ error: "Account deletion failed" }, { status: 500 });
    }
  };
}
