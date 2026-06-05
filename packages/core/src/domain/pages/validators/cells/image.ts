/**
 * @file packages/core/src/domain/pages/validators/cells/image.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateur métier de ImageCell.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Cell } from "@compoz/core/domain/pages/entities/cell";
import { assertImageEditor } from "@compoz/core/domain/pages/validators/cells/shared-image";

type Path = ReadonlyArray<string | number>;

const IMAGE_RATIOS = ["default", "wide", "square", "portrait"] as const;
const IMAGE_SIZES = ["sm", "md", "lg", "full"] as const;

export function assertSingleImageCell(
  cell: Extract<Cell, { kind: "image" }>,
  path: Path,
) {
  if (!cell.image || typeof cell.image !== "object") {
    throw new DomainError({
      code: EC.CELL_IMAGE_INVALID,
      message: EC.CELL_IMAGE_INVALID,
      details: { path: [...path, "image"] },
    });
  }

  assertImageEditor(cell.image, [...path, "image"]);

  const { variant, size } = cell;

  if (!IMAGE_RATIOS.includes(variant)) {
    throw new DomainError({
      code: EC.IMAGE_VARIANT_INVALID,
      message: EC.IMAGE_VARIANT_INVALID,
      details: { path: [...path, "variant"], meta: { variant } },
    });
  }

  if (!IMAGE_SIZES.includes(size)) {
    throw new DomainError({
      code: EC.IMAGE_SIZE_INVALID,
      message: EC.IMAGE_SIZE_INVALID,
      details: { path: [...path, "size"], meta: { size } },
    });
  }

  if (typeof cell.reveal !== "boolean") {
    throw new DomainError({
      code: EC.IMAGE_REVEAL_INVALID,
      message: EC.IMAGE_REVEAL_INVALID,
      details: {
        path: [...path, "reveal"],
        meta: { reveal: cell.reveal },
      },
    });
  }

  if (typeof cell.zoomEnabled !== "boolean") {
    throw new DomainError({
      code: EC.IMAGE_ZOOM_ENABLED_INVALID,
      message: EC.IMAGE_ZOOM_ENABLED_INVALID,
      details: {
        path: [...path, "zoomEnabled"],
        meta: { zoomEnabled: cell.zoomEnabled },
      },
    });
  }
}
