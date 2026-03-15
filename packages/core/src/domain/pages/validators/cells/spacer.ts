/**
 * @file packages/core/src/domain/pages/validators/cells/spacer.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateur métier de SpacerCell.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Cell } from "@compoz/core/domain/pages/entities/cell";

type Path = ReadonlyArray<string | number>;

const SPACER_SIZES = ["sm", "md", "lg", "xl"] as const;

export function assertSpacerCell(
  cell: Extract<Cell, { kind: "spacer" }>,
  path: Path,
) {
  if (!SPACER_SIZES.includes(cell.size)) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "size"], meta: { size: cell.size } },
    });
  }
}
