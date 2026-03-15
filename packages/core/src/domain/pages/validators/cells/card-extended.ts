/**
 * @file packages/core/src/domain/pages/validators/cells/card-extended.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateur métier de CardsExtendedCell.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  CardsExtendedItem,
  Cell,
} from "@compoz/core/domain/pages/entities/cell";

type Path = ReadonlyArray<string | number>;

const CARDS_EXTENDED_COLUMNS = [1, 2, 3] as const;
const CARDS_EXTENDED_ALIGNS = ["left", "center"] as const;

export function assertCardsExtendedCell(
  cell: Extract<Cell, { kind: "cardsExtended" }>,
  path: Path,
) {
  if (!CARDS_EXTENDED_COLUMNS.includes(cell.columns)) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: {
        path: [...path, "columns"],
        meta: { columns: cell.columns },
      },
    });
  }

  if (
    typeof cell.align !== "undefined" &&
    !CARDS_EXTENDED_ALIGNS.includes(cell.align)
  ) {
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
    assertCardsExtendedItem(cell.items[i], [...path, "items", i]);
  }
}

function assertCardsExtendedItem(item: CardsExtendedItem, path: Path) {
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

  if (typeof item.footer !== "undefined" && typeof item.footer !== "string") {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "footer"] },
    });
  }

  if (typeof item.bullets !== "undefined") {
    if (!Array.isArray(item.bullets)) {
      throw new DomainError({
        code: EC.CELL_INVALID,
        message: EC.CELL_INVALID,
        details: { path: [...path, "bullets"] },
      });
    }

    for (let i = 0; i < item.bullets.length; i++) {
      const bullet = item.bullets[i];

      if (typeof bullet !== "string" || !bullet.trim()) {
        throw new DomainError({
          code: EC.CELL_INVALID,
          message: EC.CELL_INVALID,
          details: { path: [...path, "bullets", i] },
        });
      }
    }
  }
}
