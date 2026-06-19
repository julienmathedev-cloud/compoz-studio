/**
 * @file packages/core/src/domain/pages/entities/cells/card-collection.ts
 * @layer core/domain/pages
 *
 * @description
 * Domain entities related to the CardCollection cell.
 *
 * @remarks
 * A card collection is a layout cell responsible for rendering a homogeneous
 * list of card-like items.
 *
 * The item content is defined in reusable item entities, while this cell owns
 * collection-level concerns such as item kind, columns, alignment, reveal
 * behavior, and CSS class name.
 */

import type { CardItem } from "@compoz/core/domain/pages/entities/items/card-item";
import type { ExtendedCardItem } from "@compoz/core/domain/pages/entities/items/extended-card-item";
import type { StructuredCardItem } from "@compoz/core/domain/pages/entities/items/structured-card-item";

/**
 * Supported card item kinds inside a card collection.
 *
 * @todo
 * The `"extendedCard"` and `"structuredCard"` values are temporarily kept
 * for compatibility with existing KV data. They can be migrated to singular
 * values in a dedicated data migration.
 */
export type CardCollectionCardKind =
  | "card"
  | "cardsExtended"
  | "structuredCard";

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
