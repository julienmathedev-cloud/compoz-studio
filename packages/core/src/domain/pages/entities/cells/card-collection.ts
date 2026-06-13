/**
 * @file packages/core/src/domain/pages/entities/cells/card-collection.ts
 * @layer core/domain/pages
 * @description Entités métier liées à la cellule CardCollection.
 */

import type { CardItem } from "@compoz/core/domain/pages/entities/cells/cards";
import type { CardsExtendedItem } from "@compoz/core/domain/pages/entities/cells/cards-extended";
import type { StructuredCardItem } from "@compoz/core/domain/pages/entities/cells/structured-card";

export type CardCollectionCardKind =
  | "card"
  | "cardsExtended"
  | "structuredCard";

export type CardCollectionItem =
  | CardItem
  | CardsExtendedItem
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
