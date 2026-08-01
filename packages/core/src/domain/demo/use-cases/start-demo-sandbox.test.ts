/**
 * @file packages/core/src/domain/demo/use-cases/start-demo-sandbox.test.ts
 * @layer core/domain/demo
 * @description Tests compensation when demo sandbox registration fails.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { startDemoSandbox } from "@compoz/core/domain/demo/use-cases/start-demo-sandbox";

function domainFailure(message: string): DomainError {
  return new DomainError({
    code: ERROR_CODES.INVALID_ARGUMENT,
    message,
  });
}

void test("registration failure compensates the created sandbox and demo user", async () => {
  const rollbackCalls: unknown[] = [];
  const run = startDemoSandbox({
    findReusableDemoSandbox: async () => {
      throw domainFailure("not found");
    },
    createDemoSandboxFromSeed: async () => ({
      demoInstanceId: "instance-01",
      websiteId: "demo-instance-01",
      user: {
        id: "user-01",
        email: "demo@example.test",
        name: "Demo",
        status: "active",
        rbac: {
          role: "editor",
          websiteIds: ["demo-instance-01"],
          defaultWebsiteId: "demo-instance-01",
        },
        meta: {
          createdAt: "2026-08-01T00:00:00.000Z",
          updatedAt: "2026-08-01T00:00:00.000Z",
        },
      },
    }),
    registerDemoSandbox: async () => {
      throw domainFailure("registration failed");
    },
    rollbackProvisionedSandbox: async (input) => {
      rollbackCalls.push(input);
    },
    nowIso: () => "2026-08-01T00:00:00.000Z",
    ttlMs: 60_000,
  });

  await assert.rejects(() => run({ seedWebsiteId: "demo" }));
  assert.deepEqual(rollbackCalls, [
    {
      demoInstanceId: "instance-01",
      userId: "user-01",
      websiteId: "demo-instance-01",
    },
  ]);
});

void test("rollback failure retains the registration error as the cause", async () => {
  const initial = domainFailure("registration failed");
  const run = startDemoSandbox({
    findReusableDemoSandbox: async () => {
      throw domainFailure("not found");
    },
    createDemoSandboxFromSeed: async () => ({
      demoInstanceId: "instance-01",
      websiteId: "demo-instance-01",
      user: {
        id: "user-01",
        email: "demo@example.test",
        name: "Demo",
        status: "active",
        rbac: {
          role: "editor",
          websiteIds: ["demo-instance-01"],
          defaultWebsiteId: "demo-instance-01",
        },
        meta: {
          createdAt: "2026-08-01T00:00:00.000Z",
          updatedAt: "2026-08-01T00:00:00.000Z",
        },
      },
    }),
    registerDemoSandbox: async () => {
      throw initial;
    },
    rollbackProvisionedSandbox: async () => {
      throw domainFailure("rollback failed");
    },
    nowIso: () => "2026-08-01T00:00:00.000Z",
    ttlMs: 60_000,
  });

  await assert.rejects(
    () => run({ seedWebsiteId: "demo" }),
    (error: unknown) =>
      error instanceof AggregateError && error.cause === initial,
  );
});
