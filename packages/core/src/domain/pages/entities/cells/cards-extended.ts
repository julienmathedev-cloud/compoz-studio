/**
 * @file packages/core/src/domain/pages/entities/cells/cards-extended.ts
 * @layer core/domain/pages
 * @description
 * Entité métier CardsExtendedCell.
 */

export type CardsExtendedColumns = 1 | 2 | 3;
export type CardsExtendedAlign = "left" | "center";

export type CardsExtendedItem = {
  id: string;
  title: string;
  description: string;
  bullets?: ReadonlyArray<string>;
  footer?: string;
  icon?: string;
};

export type CardsExtendedCell = {
  id: string;
  kind: "cardsExtended";
  columns: CardsExtendedColumns;
  align?: CardsExtendedAlign;
  items: ReadonlyArray<CardsExtendedItem>;
};
