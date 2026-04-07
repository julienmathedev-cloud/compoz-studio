/**
 * @file packages/core/src/domain/pages/entities/cells/cards.ts
 * @layer core/domain/pages
 * @description
 * Entité métier CardsCell.
 */
import type { ContentIconKind } from "@compoz/core/constants/icons/content-icons";

export type CardsColumns = 2 | 3 | 4;
export type CardsAlign = "left" | "center";

export type CardItem = {
  id: string;
  title: string;
  description: string;
  icon: ContentIconKind | null;
};

export type CardsCell = {
  id: string;
  kind: "cards";
  columns: CardsColumns;
  align: CardsAlign;
  reveal: boolean;
  items: ReadonlyArray<CardItem>;
};
