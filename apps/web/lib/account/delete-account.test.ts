import assert from "node:assert/strict";
import { test } from "node:test";
import { UnauthorizedError } from "@optionpilot/shared";
import {
  createDeleteAccountHandler,
  createNeonAuthUserDeleter,
  readNeonAdminConfig,
} from "./delete-account.ts";

type Row = { id: string; userId: string };

/** Two users with saved analyses. The token in the header decides who is calling. */
function setup(options: { authUserDeleted?: boolean } = {}) {
  const rows: Row[] = [
    { id: "a1", userId: "alice" },
    { id: "a2", userId: "alice" },
    { id: "b1", userId: "bob" },
  ];
  const removedAuthUsers: string[] = [];
  const handle = createDeleteAccountHandler({
    getUserId: async (request) => {
      const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
      if (token === "alice-jwt") return "alice";
      if (token === "bob-jwt") return "bob";
      throw new UnauthorizedError();
    },
    deleteAnalyses: async (userId) => {
      const before = rows.length;
      for (let index = rows.length - 1; index >= 0; index -= 1) {
        if (rows[index].userId === userId) rows.splice(index, 1);
      }
      return before - rows.length;
    },
    deleteAuthUser: async (userId) => {
      removedAuthUsers.push(userId);
      return options.authUserDeleted ?? true;
    },
  });
  const call = (token?: string) =>
    handle(
      new Request("https://optionpilot.test/api/account", {
        method: "DELETE",
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      }),
    );
  return { rows, removedAuthUsers, call };
}

test("deletes only the caller's analyses and auth user", async () => {
  const { rows, removedAuthUsers, call } = setup();
  const response = await call("alice-jwt");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { analysesDeleted: 2, authUserDeleted: true });
  assert.deepEqual(rows, [{ id: "b1", userId: "bob" }]);
  assert.deepEqual(removedAuthUsers, ["alice"]);
});

test("a second user is untouched when the first deletes, and can delete their own", async () => {
  const { rows, call } = setup();
  await call("alice-jwt");
  assert.equal(rows.filter((row) => row.userId === "bob").length, 1);
  const response = await call("bob-jwt");
  assert.deepEqual(await response.json(), { analysesDeleted: 1, authUserDeleted: true });
  assert.equal(rows.length, 0);
});

test("requires authentication and deletes nothing without it", async () => {
  const { rows, removedAuthUsers, call } = setup();
  for (const token of [undefined, "", "stranger"]) {
    const response = await call(token);
    assert.equal(response.status, 401);
  }
  assert.equal(rows.length, 3);
  assert.deepEqual(removedAuthUsers, []);
});

test("is repeatable: a second call deletes zero rows and still succeeds", async () => {
  const { call } = setup();
  await call("alice-jwt");
  const response = await call("alice-jwt");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { analysesDeleted: 0, authUserDeleted: true });
});

test("reports when the auth user could not be removed, after the data is gone", async () => {
  const { rows, call } = setup({ authUserDeleted: false });
  const response = await call("alice-jwt");
  assert.deepEqual(await response.json(), { analysesDeleted: 2, authUserDeleted: false });
  assert.equal(rows.length, 1);
});

test("a database failure is a 500 and does not touch the auth user", async () => {
  const removed: string[] = [];
  const handle = createDeleteAccountHandler({
    getUserId: async () => "alice",
    deleteAnalyses: async () => {
      throw new Error("db down");
    },
    deleteAuthUser: async (userId) => {
      removed.push(userId);
      return true;
    },
  });
  const originalError = console.error;
  console.error = () => {};
  try {
    const response = await handle(new Request("https://optionpilot.test/api/account", { method: "DELETE" }));
    assert.equal(response.status, 500);
    assert.deepEqual(removed, []);
  } finally {
    console.error = originalError;
  }
});

test("readNeonAdminConfig needs all three settings", () => {
  assert.equal(readNeonAdminConfig({}), null);
  assert.equal(readNeonAdminConfig({ NEON_API_KEY: "k", NEON_PROJECT_ID: "p" }), null);
  assert.deepEqual(readNeonAdminConfig({ NEON_API_KEY: "k", NEON_PROJECT_ID: "p", NEON_BRANCH_ID: "b" }), {
    apiKey: "k",
    projectId: "p",
    branchId: "b",
  });
});

test("the Neon deleter calls the documented endpoint for exactly one user", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const deleter = createNeonAuthUserDeleter({ apiKey: "key", projectId: "proj", branchId: "br" }, (async (
    url: string | URL | Request,
    init?: RequestInit,
  ) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(null, { status: 200 });
  }) as typeof fetch);
  assert.equal(await deleter("user/1"), true);
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    "https://console.neon.tech/api/v2/projects/proj/branches/br/auth/users/user%2F1",
  );
  assert.equal(calls[0].init.method, "DELETE");
  assert.deepEqual(calls[0].init.headers, { authorization: "Bearer key", accept: "application/json" });
});

test("the Neon deleter: not configured, 404, other errors and network failures", async () => {
  const config = { apiKey: "k", projectId: "p", branchId: "b" };
  assert.equal(await createNeonAuthUserDeleter(null)("u"), false);
  const withStatus = (status: number) =>
    createNeonAuthUserDeleter(config, (async () => new Response(null, { status })) as typeof fetch);
  assert.equal(await withStatus(404)("u"), true);
  assert.equal(await withStatus(401)("u"), false);
  assert.equal(await withStatus(500)("u"), false);
  const broken = createNeonAuthUserDeleter(config, (async () => {
    throw new TypeError("offline");
  }) as typeof fetch);
  assert.equal(await broken("u"), false);
});
