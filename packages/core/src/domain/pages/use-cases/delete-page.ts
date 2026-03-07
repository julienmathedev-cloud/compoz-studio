/**
 * @file packages/core/src/domain/pages/use-cases/delete-page.ts
 * @layer core/domain/pages/use-cases
 * @description
 * Use-case : suppression idempotente d’une page par son ID (pageId).
 *
 * @remarks
 * - Idempotent : supprimer plusieurs fois le même `pageId` doit laisser le même état.
 * - Ne modifie pas l’index (choix volontaire : suppression du contenu uniquement).
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  DeletePageDeps,
  DeletePageInput,
  DeletePageResult,
} from "@compoz/core/domain/pages/use-cases/delete-page.types";

export function deletePage({ pages }: DeletePageDeps) {
  return async function run(input: DeletePageInput): Promise<DeletePageResult> {
    const pageId = String(input.pageId ?? "").trim();

    if (!pageId) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
        details: { path: ["pageId"] },
      });
    }

    await pages.ensureBase();
    await pages.deleteById(DEFAULT_CONTENT_STATE, pageId);

    return { ok: true, pageId: pageId };
  };
}
