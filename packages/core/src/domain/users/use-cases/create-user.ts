/**
 * @file packages/core/src/domain/users/use-cases/create-user.ts
 * @layer core/domain/users/use-cases
 * @description Creates an active Studio user after validating identity, RBAC, and password input.
 * @remarks
 * The domain generates the user id; password hashing and storage remain repository responsibilities.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";

import type {
  CreateUserDeps,
  CreateUserInput,
  CreateUserResult,
} from "@compoz/core/domain/users/use-cases/create-user.types";

import {
  assertUserEmail,
  assertUserName,
  assertUserRbac,
} from "@compoz/core/domain/users/validators/users";

export function createUser({
  users,
  adminUserProvisioning,
  idGenerator,
  nowIso = () => new Date().toISOString(),
}: CreateUserDeps) {
  return async function run(input: CreateUserInput): Promise<CreateUserResult> {
    const email = assertUserEmail(input.email, ["email"]);
    const name = assertUserName(input.name, ["name"]);
    const rbac = assertUserRbac(input.rbac, ["rbac"]);

    const password = String(input.password ?? "").trim();
    if (!password) {
      throw new DomainError({
        code: EC.USER_PASSWORD_REQUIRED,
        message: EC.USER_PASSWORD_REQUIRED,
        details: { path: ["password"] },
      });
    }

    await users.ensureBase();

    if (await users.existsByEmail(email)) {
      throw new DomainError({
        code: EC.USER_EMAIL_CONFLICT,
        message: EC.USER_EMAIL_CONFLICT,
        details: { path: ["email"], meta: { email } },
      });
    }

    const now = nowIso();

    const record = {
      user: {
        id: idGenerator.nextId(),
        email,
        name,
        status: "active" as const,
        rbac,
        meta: { createdAt: now, updatedAt: now },
      },
      password,
    };

    const user = adminUserProvisioning
      ? await adminUserProvisioning.createUserWithWebsiteProvisioning(record)
      : await users.create(record);

    return { user };
  };
}
