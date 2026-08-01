/**
 * @file packages/core/src/domain/demo/use-cases/cleanup-expired-demo-sandboxes.test.ts
 * @layer core/domain/demo
 * @description Orchestration proof that cleanup continues after an isolated failure.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { cleanupExpiredDemoSandboxes } from "@compoz/core/domain/demo/use-cases/cleanup-expired-demo-sandboxes";

const sandboxes = ["a", "b", "c"].map((demoInstanceId) => ({ demoInstanceId, websiteId: `demo-${demoInstanceId}`, userId: `user-${demoInstanceId}`, expiresAt: "2026-08-01T00:00:00.000Z", createdAt: "2026-07-31T00:00:00.000Z" }));

void test("continues with B and C after sandbox A fails", async () => {
  const attempted: string[] = [];
  const run = cleanupExpiredDemoSandboxes({
    demoSandboxes: { ensureBase: async () => undefined, list: async () => sandboxes, readByDemoInstanceId: async () => null, readWebsiteById: async () => null, put: async () => undefined, deleteByDemoInstanceId: async () => undefined, existsByDemoInstanceId: async () => false },
    users: { ensureBase: async () => undefined, readById: async () => null, readByEmail: async () => null, create: async () => { throw new DomainError({ code: ERROR_CODES.INVALID_ARGUMENT }); }, put: async () => undefined, putMany: async () => undefined, setPassword: async () => undefined, verifyPassword: async () => false, deleteById: async () => undefined, deleteByEmail: async () => undefined, existsById: async () => false, existsByEmail: async () => false, list: async () => [], readManyById: async () => [] },
    sandboxDataCleaner: { deleteExpiredSandbox: async (sandbox) => { attempted.push(sandbox.demoInstanceId); if (sandbox.demoInstanceId === "a") throw new DomainError({ code: ERROR_CODES.INVALID_ARGUMENT, message: "A failed" }); return "cleaned"; } },
    nowIso: () => "2026-08-02T00:00:00.000Z",
  });
  const result = await run({ continueOnError: true });
  assert.deepEqual(attempted, ["a", "b", "c"]);
  assert.equal(result.failed, 1);
  assert.equal(result.cleaned, 2);
});
