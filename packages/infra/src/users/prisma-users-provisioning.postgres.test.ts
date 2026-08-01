/**
 * @file packages/infra/src/users/prisma-users-provisioning.postgres.test.ts
 * @layer infra/users
 * @description Opt-in PostgreSQL proof for atomic admin Website provisioning.
 * @remarks Requires COMPOZ_MEASUREMENT_DATABASE_GUARD=1 and local TEST_DATABASE_URL on port 55432.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";

import { createUser } from "@compoz/core/domain/users/use-cases/create-user";
import { updateUser } from "@compoz/core/domain/users/use-cases/update-user";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { PrismaClient } from "@compoz/infra/prisma/generated";
import { PrismaUsersRepository } from "@compoz/infra/users/prisma-users-repository";

const TEST_DATABASE_URL = process.env["TEST_DATABASE_URL"]?.trim() ?? "";
const DATABASE_GUARD = process.env["COMPOZ_MEASUREMENT_DATABASE_GUARD"] === "1";

function isApprovedLocalDatabase(value: string): boolean {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      (url.hostname === "127.0.0.1" || url.hostname === "localhost") &&
      url.port === "55432"
    );
  } catch {
    return false;
  }
}

if (TEST_DATABASE_URL && (!DATABASE_GUARD || !isApprovedLocalDatabase(TEST_DATABASE_URL))) {
  throw new Error(
    "PostgreSQL provisioning tests require COMPOZ_MEASUREMENT_DATABASE_GUARD=1 and a local TEST_DATABASE_URL on port 55432.",
  );
}

const skip =
  DATABASE_GUARD && isApprovedLocalDatabase(TEST_DATABASE_URL)
    ? false
    : "Local PostgreSQL guard and TEST_DATABASE_URL are not configured.";

function client(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: TEST_DATABASE_URL }),
    log: ["error"],
  });
}

void test("provisions sites atomically, preserves sharing, and never deletes removed sites", { skip }, async () => {
  const prisma = client();
  const suffix = randomUUID();
  const websiteA = `client-a-${suffix}`;
  const websiteB = `client-b-${suffix}`;
  const sandboxWebsite = `demo-${suffix}`;
  const userA = `user-a-${suffix}`;
  const userB = `user-b-${suffix}`;
  const repo = new PrismaUsersRepository({ client: prisma });

  try {
    const create = createUser({
      users: repo,
      adminUserProvisioning: repo,
      idGenerator: {
        nextId: (() => {
          const ids = [userA, userB];
          return () => ids.shift() ?? randomUUID();
        })(),
      },
      nowIso: () => "2026-08-01T00:00:00.000Z",
    });

    const created = await create({
      email: `owner-a-${suffix}@example.test`,
      name: "Owner A",
      password: "password",
      rbac: {
        role: "admin",
        websiteIds: [websiteA],
        defaultWebsiteId: websiteA,
      },
    });

    const website = await prisma.website.findUnique({ where: { id: websiteA } });
    assert.deepEqual(
      website && {
        id: website.id,
        slug: website.slug,
        name: website.name,
        type: website.type,
      },
      { id: websiteA, slug: websiteA, name: websiteA, type: "site" },
    );

    await create({
      email: `owner-b-${suffix}@example.test`,
      name: "Owner B",
      password: "password",
      rbac: {
        role: "editor",
        websiteIds: [websiteA],
        defaultWebsiteId: websiteA,
      },
    });
    assert.equal(await prisma.websiteAccess.count({ where: { websiteId: websiteA } }), 2);

    const update = updateUser({
      users: repo,
      adminUserProvisioning: repo,
      nowIso: () => "2026-08-02T00:00:00.000Z",
    });
    await update({
      userId: created.user.id,
      rbac: {
        role: "admin",
        websiteIds: [websiteB],
        defaultWebsiteId: websiteB,
      },
      password: "new-password",
    });

    assert.equal((await prisma.website.findUnique({ where: { id: websiteA } }))?.type, "site");
    assert.equal((await prisma.website.findUnique({ where: { id: websiteB } }))?.type, "site");
    assert.equal(await prisma.websiteAccess.count({ where: { userId: userA, websiteId: websiteA } }), 0);

    await prisma.website.create({
      data: { id: sandboxWebsite, slug: sandboxWebsite, name: "Sandbox", type: "sandbox" },
    });
    await assert.rejects(() => update({
      userId: created.user.id,
      rbac: {
        role: "admin",
        websiteIds: [sandboxWebsite],
        defaultWebsiteId: sandboxWebsite,
      },
    }));
    assert.equal((await repo.readById(created.user.id))?.rbac.defaultWebsiteId, websiteB);
  } finally {
    await prisma.website.deleteMany({ where: { id: { in: [websiteA, websiteB, sandboxWebsite] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userA, userB] } } });
    await prisma.$disconnect();
  }
});

void test("two genuinely concurrent creations share one provisioned Website and create two users and accesses", { skip }, async () => {
  const prisma = client();
  const suffix = randomUUID();
  const websiteId = `concurrent-${suffix}`;
  const ids = [`concurrent-user-a-${suffix}`, `concurrent-user-b-${suffix}`];
  try {
    const createFor = (index: number) => createUser({
      users: new PrismaUsersRepository({ client: prisma }),
      adminUserProvisioning: new PrismaUsersRepository({ client: prisma }),
      idGenerator: { nextId: () => ids[index]! },
      nowIso: () => "2026-08-01T00:00:00.000Z",
    })({
      email: `concurrent-${index}-${suffix}@example.test`,
      name: `Concurrent ${index}`,
      password: "password",
      rbac: { role: "editor", websiteIds: [websiteId], defaultWebsiteId: websiteId },
    });

    await Promise.all([createFor(0), createFor(1)]);
    assert.equal(await prisma.website.count({ where: { id: websiteId } }), 1);
    assert.equal(await prisma.user.count({ where: { id: { in: ids } } }), 2);
    assert.equal(await prisma.websiteAccess.count({ where: { websiteId } }), 2);
  } finally {
    await prisma.website.deleteMany({ where: { id: websiteId } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
});

void test("independent name and RBAC updates preserve both final values", { skip }, async () => {
  const prisma = client();
  const suffix = randomUUID();
  const userId = `independent-user-${suffix}`;
  const oldWebsite = `independent-old-${suffix}`;
  const nextWebsite = `independent-next-${suffix}`;
  const repo = new PrismaUsersRepository({ client: prisma });
  try {
    const create = createUser({ users: repo, adminUserProvisioning: repo, idGenerator: { nextId: () => userId }, nowIso: () => "2026-08-01T00:00:00.000Z" });
    await create({ email: `${suffix}@example.test`, name: "Before", password: "password", rbac: { role: "editor", websiteIds: [oldWebsite], defaultWebsiteId: oldWebsite } });
    const update = updateUser({ users: repo, adminUserProvisioning: repo, nowIso: () => "2026-08-02T00:00:00.000Z" });
    await update({ userId, name: "Final name" });
    await update({ userId, rbac: { role: "admin", websiteIds: [nextWebsite], defaultWebsiteId: nextWebsite } });
    const final = await repo.readById(userId);
    assert.equal(final?.name, "Final name");
    assert.deepEqual(final?.rbac, { role: "admin", websiteIds: [nextWebsite], defaultWebsiteId: nextWebsite });
  } finally {
    await prisma.website.deleteMany({ where: { id: { in: [oldWebsite, nextWebsite] } } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }
});

void test("a Website slug collision is a typed error and leaves no partial User or Website", { skip }, async () => {
  const prisma = client();
  const suffix = randomUUID();
  const websiteId = `wanted-${suffix}`;
  const collidingId = `existing-${suffix}`;
  const userId = `collision-user-${suffix}`;
  const repo = new PrismaUsersRepository({ client: prisma });
  try {
    await prisma.website.create({ data: { id: collidingId, slug: websiteId, name: "Existing", type: "site" } });
    const create = createUser({ users: repo, adminUserProvisioning: repo, idGenerator: { nextId: () => userId }, nowIso: () => "2026-08-01T00:00:00.000Z" });
    await assert.rejects(
      () => create({ email: `${suffix}@example.test`, name: "Collision", password: "password", rbac: { role: "editor", websiteIds: [websiteId], defaultWebsiteId: websiteId } }),
      (error: unknown) => {
        if (!(error instanceof DomainError) || error.code !== "USER_WEBSITE_IDS_INVALID") return false;
        const details = error.details as { meta?: Record<string, unknown> } | undefined;
        return details?.meta?.["reason"] === "WEBSITE_SLUG_COLLISION";
      },
    );
    assert.equal(await prisma.website.count({ where: { id: websiteId } }), 0);
    assert.equal(await prisma.user.count({ where: { id: userId } }), 0);
  } finally {
    await prisma.website.deleteMany({ where: { id: { in: [websiteId, collidingId] } } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }
});

void test("a User creation failure after Website provisioning rolls the Website back", { skip }, async () => {
  const prisma = client();
  const suffix = randomUUID();
  const userId = `rollback-user-${suffix}`;
  const websiteId = `rollback-site-${suffix}`;
  const repo = new PrismaUsersRepository({ client: prisma });
  try {
    await prisma.user.create({ data: { id: userId, email: `${suffix}@example.test`, name: "Existing", status: "active", role: "editor", passwordHash: "x" } });
    await assert.rejects(() => repo.createUserWithWebsiteProvisioning({
      user: { id: userId, email: `other-${suffix}@example.test`, name: "Duplicate id", status: "active", rbac: { role: "editor", websiteIds: [websiteId], defaultWebsiteId: websiteId }, meta: { createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" } },
      password: "password",
    }));
    assert.equal(await prisma.website.count({ where: { id: websiteId } }), 0);
    assert.equal(await prisma.user.count({ where: { id: userId } }), 1);
  } finally {
    await prisma.website.deleteMany({ where: { id: websiteId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }
});

void test("a WebsiteAccess failure rolls back password and RBAC changes", { skip }, async () => {
  const prisma = client();
  const suffix = randomUUID();
  const userId = `access-rollback-user-${suffix}`;
  const oldWebsite = `access-rollback-old-${suffix}`;
  const nextWebsite = `access-rollback-next-${suffix}`;
  const repo = new PrismaUsersRepository({ client: prisma });
  const mutableClient = prisma as unknown as {
    $transaction: (callback: (tx: unknown) => Promise<unknown>) => Promise<unknown>;
  };
  const original = mutableClient.$transaction;
  try {
    const create = createUser({ users: repo, adminUserProvisioning: repo, idGenerator: { nextId: () => userId }, nowIso: () => "2026-08-01T00:00:00.000Z" });
    await create({ email: `${suffix}@example.test`, name: "Before", password: "old-password", rbac: { role: "editor", websiteIds: [oldWebsite], defaultWebsiteId: oldWebsite } });
    mutableClient.$transaction = async (callback) => original.call(prisma, async (tx) => callback(new Proxy(tx as object, {
      get(target, property, receiver) {
        if (property !== "websiteAccess") return Reflect.get(target, property, receiver);
        const accesses = Reflect.get(target, property, receiver) as object;
        return new Proxy(accesses, { get(accessTarget, accessProperty, accessReceiver) {
          if (accessProperty === "createMany") return async () => { throw new Error("injected WebsiteAccess failure"); };
          return Reflect.get(accessTarget, accessProperty, accessReceiver);
        } });
      },
    })));
    const update = updateUser({ users: repo, adminUserProvisioning: repo, nowIso: () => "2026-08-02T00:00:00.000Z" });
    await assert.rejects(() => update({ userId, password: "new-password", rbac: { role: "admin", websiteIds: [nextWebsite], defaultWebsiteId: nextWebsite } }), /injected WebsiteAccess failure/);
    const restored = await repo.readById(userId);
    assert.deepEqual(restored?.rbac, { role: "editor", websiteIds: [oldWebsite], defaultWebsiteId: oldWebsite });
    assert.equal(await repo.verifyPassword(userId, "old-password"), true);
    assert.equal(await repo.verifyPassword(userId, "new-password"), false);
    assert.equal(await prisma.website.count({ where: { id: nextWebsite } }), 0);
  } finally {
    mutableClient.$transaction = original;
    await prisma.website.deleteMany({ where: { id: { in: [oldWebsite, nextWebsite] } } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }
});
