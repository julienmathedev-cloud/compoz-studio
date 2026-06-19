/**
 * @file packages/core/src/domain/pages/validators/cells/carousel.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateur métier de CarouselCell.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { normalizeCarouselItemKind } from "@compoz/core/domain/pages/entities/cell";
import type {
  CardItem,
  CarouselItem,
  CarouselItemKind,
  Cell,
  ExtendedCardItem,
  ImageEditor,
  StructuredCardItem,
} from "@compoz/core/domain/pages/entities/cell";
import { assertImageEditor } from "@compoz/core/domain/pages/validators/cells/shared-image";
import { assertCardItem } from "@compoz/core/domain/pages/validators/items/card-item";
import { assertExtendedCardItem } from "@compoz/core/domain/pages/validators/items/extended-card-item";
import { assertStructuredCardItem } from "@compoz/core/domain/pages/validators/items/structured-card-item";

type Path = ReadonlyArray<string | number>;

function assertCarouselVariant(value: unknown, path: Path): void {
  if (value !== "carousel" && value !== "slider") {
    throw new DomainError({
      code: EC.CELL_CAROUSEL_VARIANT_INVALID,
      message: EC.CELL_CAROUSEL_VARIANT_INVALID,
      details: { path, meta: { variant: value } },
    });
  }
}

function assertCarouselItemKind(
  value: unknown,
  path: Path,
): asserts value is CarouselItemKind {
  if (
    value !== "image" &&
    value !== "card" &&
    value !== "cardsExtended" &&
    value !== "extendedCard" &&
    value !== "structuredCard"
  ) {
    throw new DomainError({
      code: EC.CELL_CAROUSEL_ITEM_KIND_INVALID,
      message: EC.CELL_CAROUSEL_ITEM_KIND_INVALID,
      details: { path, meta: { itemKind: value } },
    });
  }
}

function assertCarouselItemByKind(
  item: CarouselItem,
  itemKind: CarouselItemKind,
  path: Path,
): void {
  switch (normalizeCarouselItemKind(itemKind)) {
    case "image":
      assertImageEditor(item as ImageEditor, path);
      return;

    case "card":
      assertCardItem(item as CardItem, path);
      return;

    case "extendedCard":
      assertExtendedCardItem(item as ExtendedCardItem, path);
      return;

    case "structuredCard":
      assertStructuredCardItem(item as StructuredCardItem, path);
      return;
  }
}

export function assertCarouselCell(
  cell: Extract<Cell, { kind: "carousel" }>,
  path: Path,
): void {
  assertCarouselVariant(cell.variant, [...path, "variant"]);

  if (typeof cell.showDots !== "boolean") {
    throw new DomainError({
      code: EC.CELL_CAROUSEL_SHOW_DOTS_INVALID,
      message: EC.CELL_CAROUSEL_SHOW_DOTS_INVALID,
      details: {
        path: [...path, "showDots"],
        meta: { showDots: cell.showDots },
      },
    });
  }

  if (typeof cell.showArrows !== "boolean") {
    throw new DomainError({
      code: EC.CELL_CAROUSEL_SHOW_ARROWS_INVALID,
      message: EC.CELL_CAROUSEL_SHOW_ARROWS_INVALID,
      details: {
        path: [...path, "showArrows"],
        meta: { showArrows: cell.showArrows },
      },
    });
  }

  assertCarouselItemKind(cell.itemKind, [...path, "itemKind"]);
  const itemKind = normalizeCarouselItemKind(cell.itemKind);

  if (!Array.isArray(cell.items)) {
    throw new DomainError({
      code: EC.CELL_CAROUSEL_ITEMS_INVALID,
      message: EC.CELL_CAROUSEL_ITEMS_INVALID,
      details: { path: [...path, "items"] },
    });
  }

  if (cell.items.length < 1) {
    throw new DomainError({
      code: EC.CELL_CAROUSEL_ITEMS_MIN_1,
      message: EC.CELL_CAROUSEL_ITEMS_MIN_1,
      details: { path: [...path, "items"] },
    });
  }

  cell.items.forEach((item, index) => {
    assertCarouselItemByKind(item, itemKind, [...path, "items", index]);
  });
}
