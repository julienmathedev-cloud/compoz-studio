/**
 * @file packages/core/src/domain/users/use-cases/update-user.ts
 * @layer core/domain/users/use-cases
 * @description Applies a partial patch to an existing Studio user.
 * @remarks
 * Password changes are delegated to the repository because hashing belongs to infra.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { User } from "@compoz/core/domain/users/entities/user";
import type {
  UpdateUserDeps,
  UpdateUserInput,
  UpdateUserResult,
} from "@compoz/core/domain/users/use-cases/update-user.types";
import {
  assertUserEmail,
  assertUserName,
  assertUserRbac,
  assertUserStatus,
} from "@compoz/core/domain/users/validators/users";

type ChangedKey = keyof Pick<User, "email" | "name" | "rbac" | "status">;

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export function updateUser({
  users,
  nowIso = () => new Date().toISOString(),
}: UpdateUserDeps) {
  return async function run(input: UpdateUserInput): Promise<UpdateUserResult> {
    const userId = String(input.userId ?? "").trim();

    if (!userId) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
        details: { path: ["userId"] },
      });
    }

    await users.ensureBase();

    const existing = await users.readById(userId);

    if (!existing) {
      throw new DomainError({
        code: EC.USER_NOT_FOUND,
        message: EC.USER_NOT_FOUND,
        details: { path: ["userId"], meta: { userId } },
      });
    }

    const next = { ...existing } as Mutable<User>;
    const changed: ChangedKey[] = [];

    if (typeof input.email === "string") {
      const email = assertUserEmail(input.email, ["email"]);

      if (email !== existing.email) {
        const conflict = await users.existsByEmail(email);

        if (conflict) {
          throw new DomainError({
            code: EC.USER_EMAIL_CONFLICT,
            message: EC.USER_EMAIL_CONFLICT,
            details: { path: ["email"], meta: { email } },
          });
        }

        next.email = email;
        changed.push("email");
      }
    }

    if (typeof input.name === "string") {
      const name = assertUserName(input.name, ["name"]);

      if (name !== existing.name) {
        next.name = name;
        changed.push("name");
      }
    }

    if (input.status !== undefined) {
      const status = assertUserStatus(input.status, ["status"]);

      if (status !== existing.status) {
        next.status = status;
        changed.push("status");
      }
    }

    if (input.rbac !== undefined) {
      const rbac = assertUserRbac(input.rbac, ["rbac"]);

      const same =
        existing.rbac.role === rbac.role &&
        existing.rbac.defaultWebsiteId === rbac.defaultWebsiteId &&
        existing.rbac.websiteIds.length === rbac.websiteIds.length &&
        existing.rbac.websiteIds.every(
          (websiteId, index) => websiteId === rbac.websiteIds[index],
        );

      if (!same) {
        next.rbac = rbac;
        changed.push("rbac");
      }
    }

    if (typeof input.password === "string") {
      const password = input.password.trim();

      if (!password) {
        throw new DomainError({
          code: EC.USER_PASSWORD_REQUIRED,
          message: EC.USER_PASSWORD_REQUIRED,
          details: { path: ["password"] },
        });
      }

      await users.setPassword(userId, password);
    }

    if (changed.length === 0) {
      return { user: existing };
    }

    next.meta = { ...existing.meta, updatedAt: nowIso() };

    await users.put(next);

    return { user: next };
  };
}
