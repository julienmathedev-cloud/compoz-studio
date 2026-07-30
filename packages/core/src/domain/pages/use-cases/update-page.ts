/**
 * @file packages/core/src/domain/pages/use-cases/update-page.ts
 * @layer core/domain/pages/use-cases
 * @description Routes a targeted draft page update intent through the atomic OCC transaction.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  UpdatePageDeps,
  UpdatePageInput,
  UpdatePageResult,
} from "@compoz/core/domain/pages/use-cases/update-page.types";

export function updatePage({ structure }: UpdatePageDeps) {
  return async function run(input: UpdatePageInput): Promise<UpdatePageResult> {
    const pageId = String(input.pageId ?? "").trim();

    if (!pageId) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
      });
    }

    return structure.update({
      pageId,
      ...(input.metadataChanges
        ? { metadataChanges: input.metadataChanges }
        : {}),
      ...(input.parentChange ? { parentChange: input.parentChange } : {}),
    });
  };
}
