/**
 * @file apps/studio/src/auth/require-session.test.ts
 * @layer studio/auth
 * @description Targeted session contract proof for impossible Website resolution.
 * @remarks Run with --experimental-test-module-mocks.
 */

import assert from "node:assert/strict";
import test from "node:test";

void test("returns WEBSITE_NOT_ALLOWED when no Studio Website can be resolved", async (t) => {
  await t.mock.module("server-only", { namedExports: {} });
  await t.mock.module("next-auth", { namedExports: { getServerSession: async () => ({ user: { id: "user-1", email: "user@example.test", role: "editor", defaultWebsiteId: "demo-expired", websiteIds: ["demo-expired"] } }) } });
  await t.mock.module("next/headers", { namedExports: { cookies: async () => ({ get: () => undefined }) } });
  await t.mock.module("@compoz/studio/auth/auth", { namedExports: { authOptions: {} } });
  await t.mock.module("@compoz/infra/websites/resolve-studio-website", { namedExports: { resolveStudioWebsite: async () => { throw new Error("no allowed Website"); } } });
  const { requireSessionWithWebsite } = await import("@compoz/studio/auth/require-session");

  await assert.rejects(
    () => requireSessionWithWebsite(),
    (error: unknown) => {
      const value = error as { __http__?: { status?: number; body?: { extras?: Record<string, unknown> } } };
      assert.equal(value.__http__?.status, 403);
      assert.equal(value.__http__?.body?.extras?.["where"], "auth.session.website");
      assert.equal(value.__http__?.body?.extras?.["reason"], "WEBSITE_NOT_ALLOWED");
      return true;
    },
  );
});
