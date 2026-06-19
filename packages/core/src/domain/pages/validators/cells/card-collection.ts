/**
 * @file packages/core/src/domain/pages/validators/cells/card-collection.ts
 * @layer core/domain/pages/validators
 * @description Validateur métier de CardCollectionCell.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  CardCollectionCardKind,
  CardCollectionItem,
  CardItem,
  Cell,
  ExtendedCardItem,
  StructuredCardItem,
} from "@compoz/core/domain/pages/entities/cell";

import { assertCardItem } from "@compoz/core/domain/pages/validators/items/card-item";

import { assertExtendedCardItem } from "@compoz/core/domain/pages/validators/items/extended-card-item";

import { assertStructuredCardItem } from "@compoz/core/domain/pages/validators/items/structured-card-item";

type Path = ReadonlyArray<string | number>;

function castCardCollectionItem<T extends CardCollectionItem>(
  item: CardCollectionItem,
): T {
  return item as T;
}

function assertCardCollectionKind(
  value: unknown,
  path: Path,
): asserts value is CardCollectionCardKind {
  if (
    value !== "card" &&
    value !== "cardsExtended" &&
    value !== "structuredCard"
  ) {
    throw new DomainError({
      code: EC.CELL_CARD_COLLECTION_KIND_INVALID,
      message: EC.CELL_CARD_COLLECTION_KIND_INVALID,
      details: { path, meta: { cardKind: value } },
    });
  }
}

function assertCardCollectionItemByKind(
  item: CardCollectionItem,
  cardKind: CardCollectionCardKind,
  path: Path,
): void {
  if (cardKind === "card") {
    assertCardItem(castCardCollectionItem<CardItem>(item), path);
    return;
  }

  if (cardKind === "cardsExtended") {
    assertExtendedCardItem(
      castCardCollectionItem<ExtendedCardItem>(item),
      path,
    );
    return;
  }

  assertStructuredCardItem(
    castCardCollectionItem<StructuredCardItem>(item),
    path,
  );
}

export function assertCardCollectionCell(
  cell: Extract<Cell, { kind: "cardCollection" }>,
  path: Path,
): void {
  assertCardCollectionKind(cell.cardKind, [...path, "cardKind"]);

  const validColumns =
    cell.cardKind === "card"
      ? cell.columns === 2 || cell.columns === 3 || cell.columns === 4
      : cell.columns === 1 || cell.columns === 2 || cell.columns === 3;

  if (!validColumns) {
    throw new DomainError({
      code: EC.CELL_CARD_COLLECTION_COLUMNS_INVALID,
      message: EC.CELL_CARD_COLLECTION_COLUMNS_INVALID,
      details: {
        path: [...path, "columns"],
        meta: { cardKind: cell.cardKind, columns: cell.columns },
      },
    });
  }

  if (cell.align !== "left" && cell.align !== "center") {
    throw new DomainError({
      code: EC.CELL_CARD_COLLECTION_ALIGN_INVALID,
      message: EC.CELL_CARD_COLLECTION_ALIGN_INVALID,
      details: { path: [...path, "align"], meta: { align: cell.align } },
    });
  }

  if (typeof cell.reveal !== "boolean") {
    throw new DomainError({
      code: EC.CELL_CARD_COLLECTION_REVEAL_INVALID,
      message: EC.CELL_CARD_COLLECTION_REVEAL_INVALID,
      details: { path: [...path, "reveal"], meta: { reveal: cell.reveal } },
    });
  }

  if (!Array.isArray(cell.items)) {
    throw new DomainError({
      code: EC.CELL_CARD_COLLECTION_ITEMS_INVALID,
      message: EC.CELL_CARD_COLLECTION_ITEMS_INVALID,
      details: { path: [...path, "items"] },
    });
  }

  if (cell.items.length < 1) {
    throw new DomainError({
      code: EC.CELL_CARD_COLLECTION_ITEMS_MIN_1,
      message: EC.CELL_CARD_COLLECTION_ITEMS_MIN_1,
      details: { path: [...path, "items"] },
    });
  }

  cell.items.forEach((item, index) => {
    assertCardCollectionItemByKind(item, cell.cardKind, [
      ...path,
      "items",
      index,
    ]);
  });
}
