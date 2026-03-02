/**
 * @file packages/core/src/domain/pages/use-cases/delete-page.ts
 * @layer core/domain
 * @description
 * Use-case : suppression idempotente d’une page par son slug.
 *
 * @remarks
 * - Idempotent : appeler plusieurs fois avec le même slug produit le même état.
 * - Le slug est validé via `assertPageSlug` (non vide, format correct).
 * - Ne modifie pas l’index (choix volontaire : suppression du contenu uniquement).
 */

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
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
      });
    }

    await pages.ensureBase();
    await pages.deleteById(WRITE_CONTENT_STATE, pageId);

    // ✅ domain pur : plus d’invalidation KV ici
    return { ok: true };
  };
}
