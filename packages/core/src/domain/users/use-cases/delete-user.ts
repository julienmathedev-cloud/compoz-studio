/**
 * @file packages/core/src/domain/users/use-cases/delete-user.ts
 * @layer core/domain
 * @description
 * Use-case : suppression idempotente d’un utilisateur Studio par son ID.
 *
 * @remarks
 * - Idempotent : appeler plusieurs fois avec le même ID produit le même état.
 * - Validation minimale : userId requis (trim non vide).
 * - Ne gère pas de contraintes avancées (ex: empêcher de supprimer le dernier admin) en V0.5.
 *   Ces règles pourront être ajoutées plus tard.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";

import type {
  DeleteUserDeps,
  DeleteUserInput,
  DeleteUserResult,
} from "@compoz/core/domain/users/use-cases/delete-user.types";

export function deleteUser({ users }: DeleteUserDeps) {
  return async function run(input: DeleteUserInput): Promise<DeleteUserResult> {
    const userId = String(input.userId ?? "").trim();
    if (!userId) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
        details: { path: ["userId"] },
      });
    }

    await users.ensureBase();
    await users.deleteById(userId);

    return { ok: true };
  };
}
