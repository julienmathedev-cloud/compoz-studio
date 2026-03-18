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

  const { variant } = cell;

  if (!IMAGE_RATIOS.includes(variant)) {
    throw new DomainError({
      code: EC.IMAGE_VARIANT_INVALID,
      message: EC.IMAGE_VARIANT_INVALID,
      details: { path: [...path, "variant"], meta: { variant } },
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
}
