/**
 * @file packages/core/src/domain/pages/entities/cells/card-collection.ts
 * @layer core/domain/pages
 * @description Card collection cell domain entity.
 * @remarks
 * Item content is defined by reusable item entities; this cell owns collection-level layout concerns.
 */

import type { CardItem } from "@compoz/core/domain/pages/entities/items/card-item";
import type { ExtendedCardItem } from "@compoz/core/domain/pages/entities/items/extended-card-item";
import type { StructuredCardItem } from "@compoz/core/domain/pages/entities/items/structured-card-item";

export type CardCollectionCardKind = "card" | "extendedCard" | "structuredCard";

export type CardCollectionItem =
  | CardItem
  | ExtendedCardItem
  | StructuredCardItem;

export type CardCollectionCardColumns = 2 | 3 | 4;

export type CardCollectionStackedColumns = 1 | 2 | 3;

export type CardCollectionColumns =
  | CardCollectionCardColumns
  | CardCollectionStackedColumns;

export type CardCollectionAlign = "left" | "center";

export type CardCollectionCell = {
  id: string;
  kind: "cardCollection";
  cssClassName?: string;
  cardKind: CardCollectionCardKind;
  columns: CardCollectionColumns;
  align: CardCollectionAlign;
  reveal: boolean;
  items: ReadonlyArray<CardCollectionItem>;
};
