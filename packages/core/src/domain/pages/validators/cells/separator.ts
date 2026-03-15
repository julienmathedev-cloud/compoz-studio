/**
 * @file packages/core/src/domain/pages/validators/cells/separator.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateur métier de SeparatorCell.
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
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "align"], meta: { align: cell.align } },
    });
  }

  if (!SEPARATOR_SIZES.includes(cell.size)) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "size"], meta: { size: cell.size } },
    });
  }
}
