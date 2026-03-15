/**
 * @file packages/core/src/domain/pages/validators/cells/step.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateur métier de StepsCell.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Cell, StepItem } from "@compoz/core/domain/pages/entities/cell";

type Path = ReadonlyArray<string | number>;

const STEPS_VARIANTS = ["vertical"] as const;

export function assertStepsCell(
  cell: Extract<Cell, { kind: "steps" }>,
  path: Path,
) {
  if (
    typeof cell.variant !== "undefined" &&
    !STEPS_VARIANTS.includes(cell.variant)
  ) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "variant"], meta: { variant: cell.variant } },
    });
  }

  if (!Array.isArray(cell.items)) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "items"] },
    });
  }

  if (cell.items.length < 1) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "items"] },
    });
  }

  for (let i = 0; i < cell.items.length; i++) {
    assertStepItem(cell.items[i], [...path, "items", i]);
  }
}

function assertStepItem(item: StepItem, path: Path) {
  if (!item || typeof item !== "object") {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path },
    });
  }

  if (typeof item.id !== "string" || !item.id.trim()) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "id"] },
    });
  }

  if (typeof item.title !== "string" || !item.title.trim()) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "title"] },
    });
  }

  if (typeof item.description !== "string" || !item.description.trim()) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "description"] },
    });
  }
}
