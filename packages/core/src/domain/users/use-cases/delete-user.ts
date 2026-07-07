/**
 * @file packages/core/src/domain/users/use-cases/delete-user.ts
 * @layer core/domain/users/use-cases
 * @description Idempotently deletes a Studio user by id.
 * @remarks
 * Advanced deletion constraints, such as preserving the last admin, are intentionally out of scope in V0.5.
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

    return { ok: true, userId };
  };
}
