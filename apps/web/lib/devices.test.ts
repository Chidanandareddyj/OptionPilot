import assert from "node:assert/strict";
import { test } from "node:test";
import { UnauthorizedError } from "@optionpilot/shared";
import { createDevicesHandler } from "./devices.ts";

const TOKEN = "ExponentPushToken[abcDEF_123]";

function setup() {
  const rows: { userId: string; token: string; platform: string }[] = [
    { userId: "alice", token: TOKEN, platform: "ios" },
  ];
  const handle = createDevicesHandler({
    getUserId: async (request) => {
      const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
      if (token === "alice-jwt") return "alice";
      if (token === "bob-jwt") return "bob";
      throw new UnauthorizedError();
    },
    save: async (userId, token, platform) => {
      const existing = rows.find((row) => row.token === token);
      if (existing) {
        existing.userId = userId;
        existing.platform = platform;
      } else {
        rows.push({ userId, token, platform });
      }
    },
    remove: async (userId, token) => {
      const index = rows.findIndex((row) => row.userId === userId && row.token === token);
      if (index < 0) return false;
      rows.splice(index, 1);
      return true;
    },
  });
  const call = (method: "POST" | "DELETE", token: string | undefined, body: unknown) =>
    handle[method](
      new Request("https://optionpilot.test/api/devices", {
        method,
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      }),
    );
  return { rows, call };
}

test("registers a phone and moves an existing token to the signed-in user", async () => {
  const { rows, call } = setup();
  const created = await call("POST", "bob-jwt", { token: "ExpoPushToken[new_phone]", platform: "android" });
  assert.equal(created.status, 200);
  assert.equal(rows.find((row) => row.token === "ExpoPushToken[new_phone]")?.userId, "bob");

  const moved = await call("POST", "bob-jwt", { token: TOKEN, platform: "android" });
  assert.equal(moved.status, 200);
  assert.deepEqual(rows.find((row) => row.token === TOKEN), { userId: "bob", token: TOKEN, platform: "android" });
});

test("one user cannot remove another's phone", async () => {
  const { rows, call } = setup();
  const response = await call("DELETE", "bob-jwt", { token: TOKEN });
  assert.equal(response.status, 404);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].userId, "alice");
});

test("the owner can remove their phone", async () => {
  const { rows, call } = setup();
  const response = await call("DELETE", "alice-jwt", { token: TOKEN });
  assert.equal(response.status, 200);
  assert.equal(rows.length, 0);
});

test("rejects a missing login and a token that is not from Expo", async () => {
  const { rows, call } = setup();
  assert.equal((await call("POST", undefined, { token: TOKEN, platform: "ios" })).status, 401);
  assert.equal((await call("POST", "alice-jwt", { token: "not-a-token", platform: "ios" })).status, 400);
  assert.equal((await call("POST", "alice-jwt", { token: TOKEN, platform: "web" })).status, 400);
  assert.equal((await call("DELETE", "alice-jwt", { token: "nope" })).status, 400);
  assert.equal(rows.length, 1);
});
