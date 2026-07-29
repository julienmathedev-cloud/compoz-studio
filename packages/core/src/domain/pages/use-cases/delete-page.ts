/**
 * @file packages/core/src/domain/pages/use-cases/delete-page.ts
 * @layer core/domain/pages/use-cases
 * @description Use case that idempotently deletes a page by id.
 * @remarks
 * Deleting the same `pageId` multiple times must leave the same state. This use case intentionally deletes content only and does not update the index.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  DeletePageDeps,
  DeletePageInput,
  DeletePageResult,
} from "@compoz/core/domain/pages/use-cases/delete-page.types";
import { assertDraftStructureRevision } from "@compoz/core/domain/pages/use-cases/helpers/assert-draft-structure-revision";

export function deletePage({ structure }: DeletePageDeps) {
  return async function run(input: DeletePageInput): Promise<DeletePageResult> {
    const pageId = String(input.pageId ?? "").trim();

    if (!pageId) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
        details: { path: ["pageId"] },
      });
    }

    return structure.delete({
      pageId,
      expectedDraftStructureRevision: assertDraftStructureRevision(
        input.expectedDraftStructureRevision,
      ),
    });
  };
}
