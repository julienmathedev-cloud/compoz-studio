/**
 * @file packages/core/src/domain/users/use-cases/create-user.test.ts
 * @layer core/domain/users/use-cases
 * @description Tests the explicit admin Website-provisioning persistence boundary.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { createUser } from "@compoz/core/domain/users/use-cases/create-user";
import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";

function usersRepository(): UsersRepository {
  return {
    ensureBase: async () => undefined,
    readById: async () => null,
    readByEmail: async () => null,
    create: async () => {
      throw new DomainError({
        code: ERROR_CODES.INVALID_ARGUMENT,
        message: "generic create must not be used for admin provisioning",
      });
    },
    put: async () => undefined,
    putMany: async () => undefined,
    setPassword: async () => undefined,
    verifyPassword: async () => false,
    deleteById: async () => undefined,
    deleteByEmail: async () => undefined,
    existsById: async () => false,
    existsByEmail: async () => false,
    list: async () => [],
    readManyById: async () => [],
  };
}

void test("admin user creation delegates Website/User/access persistence atomically", async () => {
  let received: { websiteIds: ReadonlyArray<string>; password: string } | null =
    null;

  const run = createUser({
    users: usersRepository(),
    idGenerator: { nextId: () => "user-01" },
    nowIso: () => "2026-08-01T00:00:00.000Z",
    adminUserProvisioning: {
      createUserWithWebsiteProvisioning: async ({ user, password }) => {
        received = { websiteIds: user.rbac.websiteIds, password };
        return user;
      },
      updateUserWithWebsiteProvisioning: async () => {
        throw new DomainError({
          code: ERROR_CODES.INVALID_ARGUMENT,
          message: "not called",
        });
      },
    },
  });

  const result = await run({
    email: "owner@example.test",
    name: "Owner",
    password: "password",
    rbac: {
      role: "admin",
      websiteIds: ["client-a", "client-b"],
      defaultWebsiteId: "client-a",
    },
  });

  assert.deepEqual(received, {
    websiteIds: ["client-a", "client-b"],
    password: "password",
  });
  assert.equal(result.user.id, "user-01");
});
