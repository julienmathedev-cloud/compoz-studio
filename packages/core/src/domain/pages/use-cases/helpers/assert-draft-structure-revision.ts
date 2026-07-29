/**
 * @file packages/core/src/domain/pages/use-cases/helpers/assert-draft-structure-revision.ts
 * @layer core/domain/pages/use-cases
 * @description Validates the required Website-level draft structure revision.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";

export function assertDraftStructureRevision(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new DomainError({
      code:
        value === undefined
          ? ERROR_CODES.REVISION_REQUIRED
          : ERROR_CODES.INVALID_ARGUMENT,
    });
  }

  return value;
}
