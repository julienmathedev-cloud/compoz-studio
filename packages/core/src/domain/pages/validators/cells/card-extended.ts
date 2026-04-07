/**
 * @file packages/core/src/domain/pages/validators/cells/card-extended.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateur métier de CardsExtendedCell.
 */

import { CONTENT_ICON_KINDS } from "@compoz/core/constants/icons/content-icons";
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
      code: EC.CELL_CARDS_EXTENDED_COLUMNS_INVALID,
      message: EC.CELL_CARDS_EXTENDED_COLUMNS_INVALID,
      details: {
        path: [...path, "columns"],
        meta: { columns: cell.columns },
      },
    });
  }

  if (!CARDS_EXTENDED_ALIGNS.includes(cell.align)) {
    throw new DomainError({
      code: EC.CELL_CARDS_EXTENDED_ALIGN_INVALID,
      message: EC.CELL_CARDS_EXTENDED_ALIGN_INVALID,
      details: { path: [...path, "align"], meta: { align: cell.align } },
    });
  }

  if (typeof cell.reveal !== "boolean") {
    throw new DomainError({
      code: EC.CELL_CARDS_EXTENDED_REVEAL_INVALID,
      message: EC.CELL_CARDS_EXTENDED_REVEAL_INVALID,
      details: { path: [...path, "reveal"], meta: { reveal: cell.reveal } },
    });
  }

  if (!Array.isArray(cell.items)) {
    throw new DomainError({
      code: EC.CELL_CARDS_EXTENDED_ITEMS_INVALID,
      message: EC.CELL_CARDS_EXTENDED_ITEMS_INVALID,
      details: { path: [...path, "items"] },
    });
  }

  if (cell.items.length < 1) {
    throw new DomainError({
      code: EC.CELL_CARDS_EXTENDED_ITEMS_MIN_1,
      message: EC.CELL_CARDS_EXTENDED_ITEMS_MIN_1,
      details: { path: [...path, "items"] },
    });
  }

  for (let i = 0; i < cell.items.length; i++) {
    assertCardsExtendedItem(cell.items[i], [...path, "items", i]);
  }
}

export function assertCardsExtendedItem(item: CardsExtendedItem, path: Path) {
  if (!item || typeof item !== "object") {
    throw new DomainError({
      code: EC.CELL_CARDS_EXTENDED_ITEM_INVALID,
      message: EC.CELL_CARDS_EXTENDED_ITEM_INVALID,
      details: { path },
    });
  }

  if (typeof item.id !== "string" || !item.id.trim()) {
    throw new DomainError({
      code: EC.CELL_CARDS_EXTENDED_ITEM_ID_REQUIRED,
      message: EC.CELL_CARDS_EXTENDED_ITEM_ID_REQUIRED,
      details: { path: [...path, "id"] },
    });
  }

  if (typeof item.title !== "string" || !item.title.trim()) {
    throw new DomainError({
      code: EC.CELL_CARDS_EXTENDED_ITEM_TITLE_REQUIRED,
      message: EC.CELL_CARDS_EXTENDED_ITEM_TITLE_REQUIRED,
      details: { path: [...path, "title"] },
    });
  }

  if (typeof item.description !== "string" || !item.description.trim()) {
    throw new DomainError({
      code: EC.CELL_CARDS_EXTENDED_ITEM_DESCRIPTION_REQUIRED,
      message: EC.CELL_CARDS_EXTENDED_ITEM_DESCRIPTION_REQUIRED,
      details: { path: [...path, "description"] },
    });
  }

  if (
    item.icon !== null &&
    (typeof item.icon !== "string" || !CONTENT_ICON_KINDS.includes(item.icon))
  ) {
    throw new DomainError({
      code: EC.CELL_CARDS_EXTENDED_ITEM_ICON_INVALID,
      message: EC.CELL_CARDS_EXTENDED_ITEM_ICON_INVALID,
      details: {
        path: [...path, "icon"],
        meta: { icon: item.icon },
      },
    });
  }

  if (item.footer !== null && typeof item.footer !== "string") {
    throw new DomainError({
      code: EC.CELL_CARDS_EXTENDED_ITEM_FOOTER_INVALID,
      message: EC.CELL_CARDS_EXTENDED_ITEM_FOOTER_INVALID,
      details: { path: [...path, "footer"] },
    });
  }

  if (!Array.isArray(item.bullets)) {
    throw new DomainError({
      code: EC.CELL_CARDS_EXTENDED_ITEM_BULLETS_INVALID,
      message: EC.CELL_CARDS_EXTENDED_ITEM_BULLETS_INVALID,
      details: { path: [...path, "bullets"] },
    });
  }

  for (let i = 0; i < item.bullets.length; i++) {
    const bullet = item.bullets[i];

    if (typeof bullet !== "string" || !bullet.trim()) {
      throw new DomainError({
        code: EC.CELL_CARDS_EXTENDED_ITEM_BULLET_INVALID,
        message: EC.CELL_CARDS_EXTENDED_ITEM_BULLET_INVALID,
        details: { path: [...path, "bullets", i] },
      });
    }
  }
}
