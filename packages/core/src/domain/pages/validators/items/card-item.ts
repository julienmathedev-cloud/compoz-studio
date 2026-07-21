/**
 * @file packages/core/src/domain/pages/validators/items/card-item.ts
 * @layer core/domain/pages/validators
 * @description Domain validator for simple card items.
 * @remarks
 * Card items are reused by higher-level cells such as `cardCollection` or `carousel`.
 */

import { CONTENT_ICON_KINDS } from "@compoz/core/constants/icons/content-icons";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { CardItem } from "@compoz/core/domain/pages/entities/cell";
import { assertButtonItem } from "@compoz/core/domain/pages/validators/cells/button";

type Path = ReadonlyArray<string | number>;

export function assertCardItem(item: CardItem, path: Path) {
  if (!item || typeof item !== "object") {
    throw new DomainError({
      code: EC.CELL_CARD_ITEM_INVALID,
      message: EC.CELL_CARD_ITEM_INVALID,
      details: { path },
    });
  }

  if (typeof item.id !== "string" || !item.id.trim()) {
    throw new DomainError({
      code: EC.CELL_CARD_ITEM_ID_REQUIRED,
      message: EC.CELL_CARD_ITEM_ID_REQUIRED,
      details: { path: [...path, "id"] },
    });
  }

  if (item.eyebrow !== null && typeof item.eyebrow !== "string") {
    throw new DomainError({
      code: EC.CELL_CARD_ITEM_INVALID,
      message: EC.CELL_CARD_ITEM_INVALID,
      details: { path: [...path, "eyebrow"] },
    });
  }

  if (typeof item.title !== "string" || !item.title.trim()) {
    throw new DomainError({
      code: EC.CELL_CARD_ITEM_TITLE_REQUIRED,
      message: EC.CELL_CARD_ITEM_TITLE_REQUIRED,
      details: { path: [...path, "title"] },
    });
  }

  if (typeof item.description !== "string" || !item.description.trim()) {
    throw new DomainError({
      code: EC.CELL_CARD_ITEM_DESCRIPTION_REQUIRED,
      message: EC.CELL_CARD_ITEM_DESCRIPTION_REQUIRED,
      details: { path: [...path, "description"] },
    });
  }

  if (
    item.icon !== null &&
    (typeof item.icon !== "string" || !CONTENT_ICON_KINDS.includes(item.icon))
  ) {
    throw new DomainError({
      code: EC.CELL_CARD_ITEM_ICON_INVALID,
      message: EC.CELL_CARD_ITEM_ICON_INVALID,
      details: {
        path: [...path, "icon"],
        meta: { icon: item.icon },
      },
    });
  }

  if (item.button !== null) {
    assertButtonItem(item.button, [...path, "button"]);
  }
}
