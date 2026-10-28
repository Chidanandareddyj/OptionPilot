import { createDevicesHandler } from "@/lib/devices";
import { getRequestUserId } from "@/lib/auth/request-user";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const handler = createDevicesHandler({
  getUserId: (request) => getRequestUserId(request),
  save: async (userId, token, platform) => {
    await prisma.device.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
  },
  remove: async (userId, token) => (await prisma.device.deleteMany({ where: { userId, token } })).count > 0,
});

export const POST = handler.POST;
export const DELETE = handler.DELETE;
