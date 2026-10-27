import {
  createDeleteAccountHandler,
  createNeonAuthUserDeleter,
  readNeonAdminConfig,
} from "@/lib/account/delete-account";
import { getRequestUserId } from "@/lib/auth/request-user";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Hard-deletes the signed-in user's saved analyses and, when the Neon API settings
 * (NEON_API_KEY, NEON_PROJECT_ID, NEON_BRANCH_ID) are set, their Neon Auth user.
 */
export const DELETE = createDeleteAccountHandler({
  getUserId: (request) => getRequestUserId(request),
  deleteAnalyses: async (userId) => (await prisma.analysis.deleteMany({ where: { userId } })).count,
  deleteAuthUser: (userId) => createNeonAuthUserDeleter(readNeonAdminConfig(process.env))(userId),
});
