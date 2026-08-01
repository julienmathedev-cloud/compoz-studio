/**
 * @file packages/core/src/domain/demo/use-cases/find-reusable-demo-sandbox.test.ts
 * @layer core/domain/demo
 * @description Consistency tests for demo sandbox reuse.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { DemoSandboxRepository } from "@compoz/core/domain/demo/ports/demo-sandbox-repository";
import type { User } from "@compoz/core/domain/users/entities/user";
import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";
import { findReusableDemoSandbox } from "@compoz/core/domain/demo/use-cases/find-reusable-demo-sandbox";

const sandbox = {
  demoInstanceId: "instance-01",
  userId: "user-01",
  websiteId: "demo-instance-01",
  expiresAt: "2026-08-02T00:00:00.000Z",
  createdAt: "2026-08-01T00:00:00.000Z",
};

const user: User = {
  id: sandbox.userId,
  email: "demo@example.test",
  name: "Demo",
  status: "active",
  rbac: {
    role: "editor",
    websiteIds: [sandbox.websiteId],
    defaultWebsiteId: sandbox.websiteId,
  },
  meta: {
    createdAt: sandbox.createdAt,
    updatedAt: sandbox.createdAt,
  },
  demo: {
    isDemo: true,
    demoInstanceId: sandbox.demoInstanceId,
    expiresAt: sandbox.expiresAt,
  },
};

function demoRepository(
  website: Awaited<ReturnType<DemoSandboxRepository["readWebsiteById"]>>,
): DemoSandboxRepository {
  return {
    ensureBase: async () => undefined,
    list: async () => [sandbox],
    readByDemoInstanceId: async () => sandbox,
    readWebsiteById: async () => website,
    put: async () => undefined,
    deleteByDemoInstanceId: async () => undefined,
    existsByDemoInstanceId: async () => true,
  };
}

function usersRepository(value: User): UsersRepository {
  return {
    ensureBase: async () => undefined,
    readById: async () => value,
    readByEmail: async () => null,
    create: async () => value,
    put: async () => undefined,
    putMany: async () => undefined,
    setPassword: async () => undefined,
    verifyPassword: async () => false,
    deleteById: async () => undefined,
    deleteByEmail: async () => undefined,
    existsById: async () => true,
    existsByEmail: async () => false,
    list: async () => [],
    readManyById: async () => [],
  };
}

function cloneUser(overrides: Partial<User> = {}): User {
  const hasDemoOverride = Object.hasOwn(overrides, "demo");
  return {
    ...user,
    ...overrides,
    rbac: { ...user.rbac, ...overrides.rbac },
    meta: { ...user.meta, ...overrides.meta },
    ...(hasDemoOverride ? { demo: overrides.demo } : { demo: user.demo }),
  };
}

async function assertNotReusable(args: {
  website?: Awaited<ReturnType<DemoSandboxRepository["readWebsiteById"]>>;
  sandboxValue?: typeof sandbox;
  userValue?: User | null;
} = {}): Promise<void> {
  const sandboxValue = args.sandboxValue ?? sandbox;
  const repo = demoRepository(args.website === undefined
    ? { id: sandbox.websiteId, type: "sandbox", expiresAt: sandbox.expiresAt }
    : args.website);
  repo.readByDemoInstanceId = async () => sandboxValue;
  const users = usersRepository(args.userValue === undefined ? user : args.userValue as User);
  users.readById = async () => args.userValue === undefined ? user : args.userValue;
  const run = findReusableDemoSandbox({
    demoSandboxes: repo,
    users,
    nowIso: () => "2026-08-01T12:00:00.000Z",
  });

  await assert.rejects(() => run({ demoInstanceId: sandbox.demoInstanceId }));
}

void test("reuses a valid unexpired sandbox Website with matching user access", async () => {
  const run = findReusableDemoSandbox({
    demoSandboxes: demoRepository({
      id: sandbox.websiteId,
      type: "sandbox",
      expiresAt: sandbox.expiresAt,
    }),
    users: usersRepository(user),
    nowIso: () => "2026-08-01T12:00:00.000Z",
  });

  const result = await run({ demoInstanceId: sandbox.demoInstanceId });
  assert.equal(result.websiteId, sandbox.websiteId);
});

void test("does not reuse an incoherent demoInstanceId and Website identity", async () => {
  await assertNotReusable({
    sandboxValue: { ...sandbox, websiteId: "demo-other-instance" },
  });
});

void test("does not reuse when Website is absent", async () => {
  await assertNotReusable({ website: null });
});

void test("does not reuse a Website of type site", async () => {
  await assertNotReusable({
    website: { id: sandbox.websiteId, type: "site", expiresAt: sandbox.expiresAt },
  });
});

void test("does not reuse an expired Website", async () => {
  await assertNotReusable({
    website: { id: sandbox.websiteId, type: "sandbox", expiresAt: "2026-08-01T00:00:00.000Z" },
  });
});

void test("does not reuse a Website without expiresAt", async () => {
  await assertNotReusable({
    website: { id: sandbox.websiteId, type: "sandbox", expiresAt: null },
  });
});

void test("does not reuse when the User is absent", async () => {
  await assertNotReusable({ userValue: null });
});

void test("does not reuse a User not marked as demo", async () => {
  await assertNotReusable({ userValue: cloneUser({ demo: undefined }) });
});

void test("does not reuse a User with another demoInstanceId", async () => {
  await assertNotReusable({
    userValue: cloneUser({ demo: { ...user.demo!, demoInstanceId: "other" } }),
  });
});

void test("does not reuse a User with another defaultWebsiteId", async () => {
  await assertNotReusable({
    userValue: cloneUser({ rbac: { ...user.rbac, defaultWebsiteId: "other" } }),
  });
});

void test("does not reuse when WebsiteAccess is absent", async () => {
  await assertNotReusable({
    userValue: cloneUser({ rbac: { ...user.rbac, websiteIds: [] } }),
  });
});
