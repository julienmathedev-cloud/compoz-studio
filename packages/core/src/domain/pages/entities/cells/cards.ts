/**
 * @file packages/core/src/domain/pages/entities/cells/cards.ts
 * @layer core/domain/pages
 * @description
 * Entité métier CardsCell.
 */

export type CardsColumns = 2 | 3 | 4;
export type CardsAlign = "left" | "center";

export type CardItem = {
  id: string;
  title: string;
  description: string;
  icon?: string;
};

export type CardsCell = {
  id: string;
  kind: "cards";
  columns: CardsColumns;
  align?: CardsAlign;
  items: ReadonlyArray<CardItem>;
};
