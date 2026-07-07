/**
 * @file packages/core/src/domain/pages/validators/cells/separator.ts
 * @layer core/domain/pages/validators
 * @description Domain validator for separator cells.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Cell } from "@compoz/core/domain/pages/entities/cell";

type Path = ReadonlyArray<string | number>;

const SEPARATOR_ALIGNS = ["left", "center", "right", "full"] as const;
const SEPARATOR_SIZES = ["sm", "md", "lg"] as const;

export function assertSeparatorCell(
  cell: Extract<Cell, { kind: "separator" }>,
  path: Path,
) {
  if (!SEPARATOR_ALIGNS.includes(cell.align)) {
    throw new DomainError({
      code: EC.CELL_SEPARATOR_ALIGN_INVALID,
      message: EC.CELL_SEPARATOR_ALIGN_INVALID,
      details: { path: [...path, "align"], meta: { align: cell.align } },
    });
  }

  if (!SEPARATOR_SIZES.includes(cell.size)) {
    throw new DomainError({
      code: EC.CELL_SEPARATOR_SIZE_INVALID,
      message: EC.CELL_SEPARATOR_SIZE_INVALID,
      details: { path: [...path, "size"], meta: { size: cell.size } },
    });
  }
}
