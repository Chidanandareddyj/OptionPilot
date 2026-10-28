import { UnauthorizedError } from "@optionpilot/shared";

const TOKEN = /^(Exponent|Expo)PushToken\[[A-Za-z0-9_-]+\]$/;
const PLATFORMS = new Set(["ios", "android"]);

export type DeviceDeps = {
  getUserId: (request: Request) => Promise<string>;
  /** Stores the token for this user. A token already stored is moved to this user. */
  save: (userId: string, token: string, platform: string) => Promise<void>;
  /** Deletes the token only when it belongs to this user. False when it does not. */
  remove: (userId: string, token: string) => Promise<boolean>;
};

function readBody(body: unknown): { token: string; platform: string } | null {
  if (!body || typeof body !== "object") return null;
  const token = (body as { token?: unknown }).token;
  const platform = (body as { platform?: unknown }).platform;
  if (typeof token !== "string" || !TOKEN.test(token)) return null;
  if (typeof platform !== "string" || !PLATFORMS.has(platform)) return null;
  return { token, platform };
}

async function jsonBody(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}

/** `POST /api/devices` registers this phone. `DELETE /api/devices` removes it, and only if it is the caller's. */
export function createDevicesHandler(deps: DeviceDeps) {
  return {
    async POST(request: Request): Promise<Response> {
      try {
        const userId = await deps.getUserId(request);
        const body = readBody(await jsonBody(request));
        if (!body) return Response.json({ error: "Send an Expo push token and a platform of ios or android." }, { status: 400 });
        await deps.save(userId, body.token, body.platform);
        return Response.json({ ok: true });
      } catch (error) {
        if (error instanceof UnauthorizedError) return Response.json({ error: "Unauthorized" }, { status: 401 });
        console.error("[/api/devices post error]:", error);
        return Response.json({ error: "Could not register this phone" }, { status: 500 });
      }
    },
    async DELETE(request: Request): Promise<Response> {
      try {
        const userId = await deps.getUserId(request);
        const body = await jsonBody(request);
        const token = body && typeof body === "object" ? (body as { token?: unknown }).token : null;
        if (typeof token !== "string" || !TOKEN.test(token)) {
          return Response.json({ error: "Send the Expo push token to remove." }, { status: 400 });
        }
        const removed = await deps.remove(userId, token);
        if (!removed) return Response.json({ error: "That phone is not registered to you." }, { status: 404 });
        return Response.json({ ok: true });
      } catch (error) {
        if (error instanceof UnauthorizedError) return Response.json({ error: "Unauthorized" }, { status: 401 });
        console.error("[/api/devices delete error]:", error);
        return Response.json({ error: "Could not remove this phone" }, { status: 500 });
      }
    },
  };
}
