/**
 * @file packages/core/src/domain/pages/validators/cells/card.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateur métier de CardsCell.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { CardItem, Cell } from "@compoz/core/domain/pages/entities/cell";

type Path = ReadonlyArray<string | number>;

const CARDS_COLUMNS = [2, 3, 4] as const;
const CARDS_ALIGNS = ["left", "center"] as const;

export function assertCardsCell(
  cell: Extract<Cell, { kind: "cards" }>,
  path: Path,
) {
  if (!CARDS_COLUMNS.includes(cell.columns)) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: {
        path: [...path, "columns"],
        meta: { columns: cell.columns },
      },
    });
  }

  if (typeof cell.align !== "undefined" && !CARDS_ALIGNS.includes(cell.align)) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "align"], meta: { align: cell.align } },
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
    assertCardItem(cell.items[i], [...path, "items", i]);
  }
}

function assertCardItem(item: CardItem, path: Path) {
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

  if (typeof item.icon !== "undefined" && typeof item.icon !== "string") {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "icon"] },
    });
  }
}
