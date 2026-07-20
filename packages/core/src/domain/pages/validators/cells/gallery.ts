/**
 * @file packages/core/src/domain/pages/validators/cells/gallery.ts
 * @layer core/domain/pages/validators
 * @description Domain validator for gallery cells.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { assertMultiImageCell } from "@compoz/core/domain/pages/validators/cells/shared-image";

type Path = ReadonlyArray<string | number>;

export function assertGalleryMaxColumns(maxColumns: unknown, path: Path) {
  if (
    typeof maxColumns !== "number" ||
    !Number.isInteger(maxColumns) ||
    maxColumns < 1 ||
    maxColumns > 6
  ) {
    throw new DomainError({
      code: EC.GALLERY_MAX_COLUMNS_INVALID,
      message: EC.GALLERY_MAX_COLUMNS_INVALID,
      details: { path: [...path, "maxColumns"], meta: { maxColumns } },
    });
  }
}

export { assertMultiImageCell };
