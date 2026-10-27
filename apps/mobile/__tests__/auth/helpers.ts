import type { KeyValueBackend } from "@/lib/auth/sessionStore";

/** An unsigned JWT whose payload carries `exp` (in seconds). The app never checks signatures. */
export function makeJwt(expSeconds: number, extra: Record<string, unknown> = {}): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${encode({ alg: "EdDSA" })}.${encode({ exp: expSeconds, ...extra })}.signature`;
}

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

export function memoryBackend(initial: Record<string, string> = {}): KeyValueBackend & {
  data: Map<string, string>;
} {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => void data.set(key, value),
    deleteItem: async (key) => void data.delete(key),
  };
}

export const USER = { id: "user-1", email: "asha@example.com", name: "Asha" };
