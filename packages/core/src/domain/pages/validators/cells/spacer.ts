/**
 * @file packages/core/src/domain/pages/validators/cells/spacer.ts
 * @layer core/domain/pages/validators
 * @description Domain validator for spacer cells.
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
      code: EC.CELL_SPACER_SIZE_INVALID,
      message: EC.CELL_SPACER_SIZE_INVALID,
      details: { path: [...path, "size"], meta: { size: cell.size } },
    });
  }

  const visibility = cell.visibility;

  if (!visibility || typeof visibility !== "object") {
    throw new DomainError({
      code: EC.CELL_SPACER_VISIBILITY_INVALID,
      message: EC.CELL_SPACER_VISIBILITY_INVALID,
      details: { path: [...path, "visibility"] },
    });
  }

  const devices: Array<keyof typeof visibility> = [
    "mobile",
    "tablet",
    "desktop",
  ];

  for (const device of devices) {
    if (typeof visibility[device] !== "boolean") {
      throw new DomainError({
        code: EC.CELL_SPACER_VISIBILITY_INVALID,
        message: EC.CELL_SPACER_VISIBILITY_INVALID,
        details: {
          path: [...path, "visibility", device],
          meta: { value: visibility[device] },
        },
      });
    }
  }
}
