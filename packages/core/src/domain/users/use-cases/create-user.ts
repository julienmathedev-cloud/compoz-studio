/**
 * @file packages/core/src/domain/users/use-cases/create-user.ts
 * @layer core/domain
 * @description
 * Use-case de création d’un utilisateur Studio (email/name/rbac + password).
 *
 * Règles métier (V0.5/V1) :
 * - email requis, normalisé (lower-case) + format basique
 * - name requis (trim)
 * - rbac validé (role + tenantIds + defaultTenantId)
 * - email unique (on refuse si déjà présent)
 * - création atomique côté repo (user + password hash + rbac)
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

export function createUser({ users, idGenerator }: CreateUserDeps) {
  return async function run(input: CreateUserInput): Promise<CreateUserResult> {
    // 1) Validation + normalisation domaine
    const email = assertUserEmail(input.email, ["email"]);
    const name = assertUserName(input.name, ["name"]);
    const password = String(input.password ?? "").trim();

    if (!password) {
      throw new DomainError({
        code: EC.USER_PASSWORD_REQUIRED,
        message: EC.USER_PASSWORD_REQUIRED,
        details: { path: ["password"] },
      });
    }

    const rbac = assertUserRbac(input.rbac, ["rbac"]);

    // 2) Contrainte d’unicité (email)
    const existing = await users.existsByEmail(email);
    if (existing) {
      throw new DomainError({
        code: EC.USER_EMAIL_CONFLICT,
        message: EC.USER_EMAIL_CONFLICT,
        details: { path: ["email"], meta: { email } },
      });
    }

    // 3) Création (repo)
    await users.ensureBase();

    const created = await users.create({
      id: idGenerator.nextId(),
      email,
      name,
      password,
      rbac,
    });

    return { user: created };
  };
}
