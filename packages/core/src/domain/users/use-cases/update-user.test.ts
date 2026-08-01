/**
 * @file packages/core/src/domain/users/use-cases/update-user.test.ts
 * @layer core/domain/users/use-cases
 * @description Tests atomic admin user RBAC and password persistence delegation.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { User } from "@compoz/core/domain/users/entities/user";
import type { UpdateAdminUserProvisioningInput } from "@compoz/core/domain/users/ports/admin-user-provisioning-transaction";
import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";
import { updateUser } from "@compoz/core/domain/users/use-cases/update-user";

const EXISTING: User = {
  id: "user-01",
  email: "owner@example.test",
  name: "Owner",
  status: "active",
  rbac: {
    role: "admin",
    websiteIds: ["client-a"],
    defaultWebsiteId: "client-a",
  },
  meta: {
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
};

function usersRepository(): UsersRepository {
  return {
    ensureBase: async () => undefined,
    readById: async () => EXISTING,
    readByEmail: async () => null,
    create: async () => EXISTING,
    put: async () => {
      throw new DomainError({
        code: ERROR_CODES.INVALID_ARGUMENT,
        message: "generic put must not be used for admin provisioning",
      });
    },
    putMany: async () => undefined,
    setPassword: async () => {
      throw new DomainError({
        code: ERROR_CODES.INVALID_ARGUMENT,
        message: "password must be included in the transaction",
      });
    },
    verifyPassword: async () => false,
    deleteById: async () => undefined,
    deleteByEmail: async () => undefined,
    existsById: async () => true,
    existsByEmail: async () => false,
    list: async () => [],
    readManyById: async () => [],
  };
}

void test("password and RBAC update share the admin provisioning transaction", async () => {
  let received:
    | {
        password?: string;
        hasRbacChange: boolean;
        websiteIds: ReadonlyArray<string>;
      }
    | undefined;

  const run = updateUser({
    users: usersRepository(),
    nowIso: () => "2026-08-02T00:00:00.000Z",
    adminUserProvisioning: {
      createUserWithWebsiteProvisioning: async ({ user }) => user,
      updateUserWithWebsiteProvisioning: async (input) => {
        received = {
          password: input.password,
          hasRbacChange: Boolean(input.rbacChange),
          websiteIds: input.rbacChange?.websiteIds ?? [],
        };
        return {
          ...EXISTING,
          rbac: input.rbacChange ?? EXISTING.rbac,
        };
      },
    },
  });

  await run({
    userId: EXISTING.id,
    password: "new-password",
    rbac: {
      role: "admin",
      websiteIds: ["client-a", "client-b"],
      defaultWebsiteId: "client-b",
    },
  });

  assert.deepEqual(received, {
    password: "new-password",
    hasRbacChange: true,
    websiteIds: ["client-a", "client-b"],
  });
});

void test("scalar-only updates produce no RBAC change", async () => {
  const received: { value: UpdateAdminUserProvisioningInput | null } = {
    value: null,
  };

  const run = updateUser({
    users: usersRepository(),
    nowIso: () => "2026-08-02T00:00:00.000Z",
    adminUserProvisioning: {
      createUserWithWebsiteProvisioning: async ({ user }) => user,
      updateUserWithWebsiteProvisioning: async (input) => {
        received.value = input;
        return { ...EXISTING, name: input.scalarChanges?.name ?? EXISTING.name };
      },
    },
  });

  await run({ userId: EXISTING.id, name: "Alicia" });

  assert.deepEqual(received.value?.scalarChanges, { name: "Alicia" });
  assert.equal(received.value?.rbacChange, undefined);
  assert.equal(received.value?.password, undefined);
});
