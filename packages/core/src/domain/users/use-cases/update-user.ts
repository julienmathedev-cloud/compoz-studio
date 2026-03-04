/**
 * @file packages/core/src/domain/users/use-cases/update-user.ts
 * @layer core/domain
 * @description
 * Use-case : mise à jour d’un utilisateur Studio via patch partiel.
 *
 * @remarks
 * - No-op : si rien ne change (hors password), aucune écriture User n’est effectuée.
 * - Email : si modifié, normalisé + vérifie l’unicité.
 * - RBAC : validé si présent.
 * - Status : validé si présent (active|disabled).
 * - Password : optionnel, via `users.setPassword` (infra-only).
 * - Meta : met à jour `updatedAt` si un champ du profil change.
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

    const next: User = { ...existing };
    const changed: ChangedKey[] = [];

    /* ---------------------------------------------------------------------- */
    /* Email                                                                   */
    /* ---------------------------------------------------------------------- */

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

    /* ---------------------------------------------------------------------- */
    /* Name                                                                    */
    /* ---------------------------------------------------------------------- */

    if (typeof input.name === "string") {
      const name = assertUserName(input.name, ["name"]);
      if (name !== (existing.name ?? "")) {
        next.name = name;
        changed.push("name");
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Status                                                                  */
    /* ---------------------------------------------------------------------- */

    if (input.status !== undefined) {
      const status = assertUserStatus(input.status, ["status"]);
      if (status !== existing.status) {
        next.status = status;
        changed.push("status");
      }
    }

    /* ---------------------------------------------------------------------- */
    /* RBAC                                                                    */
    /* ---------------------------------------------------------------------- */

    if (input.rbac !== undefined) {
      const rbac = assertUserRbac(input.rbac, ["rbac"]);

      // comparaison simple (ok V0.5)
      const same =
        existing.rbac.role === rbac.role &&
        existing.rbac.defaultTenantId === rbac.defaultTenantId &&
        existing.rbac.tenantIds.join("|") === rbac.tenantIds.join("|");

      if (!same) {
        next.rbac = rbac;
        changed.push("rbac");
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Password (infra-only)                                                   */
    /* ---------------------------------------------------------------------- */

    if (typeof input.password === "string") {
      const pwd = input.password.trim();
      if (!pwd) {
        throw new DomainError({
          code: EC.USER_PASSWORD_REQUIRED,
          message: EC.USER_PASSWORD_REQUIRED,
          details: { path: ["password"] },
        });
      }

      await users.setPassword(userId, pwd);
    }

    // No-op : si rien n'a changé côté profil, on ne touche pas au user
    if (changed.length === 0) {
      return { user: existing };
    }

    // Meta updatedAt si modification profil
    next.meta = { ...existing.meta, updatedAt: nowIso() };

    await users.put(next);

    return { user: next };
  };
}
