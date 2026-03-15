/**
 * @file packages/core/src/domain/pages/validators/cells/button.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateur métier de ButtonsCell.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { ButtonItem, Cell } from "@compoz/core/domain/pages/entities/cell";

type Path = ReadonlyArray<string | number>;

const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost"] as const;
const BUTTON_ALIGNS = ["left", "center", "right"] as const;
const BUTTON_GAPS = ["sm", "md", "lg"] as const;

export function assertButtonsCell(
  cell: Extract<Cell, { kind: "buttons" }>,
  path: Path,
) {
  if (
    typeof cell.align !== "undefined" &&
    !BUTTON_ALIGNS.includes(cell.align)
  ) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "align"], meta: { align: cell.align } },
    });
  }

  if (typeof cell.gap !== "undefined" && !BUTTON_GAPS.includes(cell.gap)) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "gap"], meta: { gap: cell.gap } },
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
    assertButtonItem(cell.items[i], [...path, "items", i]);
  }
}

function assertButtonItem(item: ButtonItem, path: Path) {
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

  if (typeof item.label !== "string" || !item.label.trim()) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "label"] },
    });
  }

  if (typeof item.href !== "string") {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "href"] },
    });
  }

  if (!BUTTON_VARIANTS.includes(item.variant)) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "variant"], meta: { variant: item.variant } },
    });
  }
}
