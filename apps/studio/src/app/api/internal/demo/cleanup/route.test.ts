/**
 * @file apps/studio/src/app/api/internal/demo/cleanup/route.test.ts
 * @layer studio/app/api
 * @description Contract tests for the real demo cleanup cron GET handler.
 * @remarks Run with --experimental-test-module-mocks so the production composition is not invoked.
 */

import assert from "node:assert/strict";
import test from "node:test";

type CleanupResult = {
  total: number;
  expired: number;
  cleaned: number;
  failed: number;
  items: Array<{ demoInstanceId: string; websiteId: string; userId: string; status: "cleaned" | "failed" }>;
};

void test("GET enforces Bearer-only cron auth and returns the exact cleanup summary", async (t) => {
  const previousSecret = process.env["CRON_SECRET"];
  process.env["CRON_SECRET"] = "cron-test-secret";
  let nextResult: CleanupResult = { total: 2, expired: 2, cleaned: 2, failed: 0, items: [] };
  await t.mock.module("server-only", { namedExports: {} });
  await t.mock.module("@compoz/studio/lib/demo/cleanup-expired-demo-sandboxes", {
    namedExports: { runCleanupExpiredDemoSandboxes: async () => nextResult },
  });
  const { GET } = await import("@compoz/studio/app/api/internal/demo/cleanup/route");

  try {
    for (const request of [
      new Request("https://studio.test/api/internal/demo/cleanup"),
      new Request("https://studio.test/api/internal/demo/cleanup", { headers: { authorization: "Bearer wrong" } }),
      new Request("https://studio.test/api/internal/demo/cleanup", { headers: { "x-cron-secret": "cron-test-secret" } }),
    ]) {
      const response = await GET(request);
      assert.equal(response.status, 401);
    }

    let response = await GET(new Request("https://studio.test/api/internal/demo/cleanup", { headers: { authorization: "Bearer cron-test-secret" } }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, cleanup: { total: 2, expired: 2, cleaned: 2, failed: 0 } });

    nextResult = {
      total: 3,
      expired: 3,
      cleaned: 2,
      failed: 1,
      items: [
        { demoInstanceId: "a", websiteId: "demo-a", userId: "a", status: "failed" },
        { demoInstanceId: "b", websiteId: "demo-b", userId: "b", status: "cleaned" },
        { demoInstanceId: "c", websiteId: "demo-c", userId: "c", status: "cleaned" },
      ],
    };
    response = await GET(new Request("https://studio.test/api/internal/demo/cleanup", { headers: { authorization: "Bearer cron-test-secret" } }));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { ok: false, cleanup: { total: 3, expired: 3, cleaned: 2, failed: 1 } });
  } finally {
    if (previousSecret === undefined) delete process.env["CRON_SECRET"];
    else process.env["CRON_SECRET"] = previousSecret;
  }
});
