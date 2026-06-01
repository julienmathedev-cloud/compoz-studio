/**
 * @file packages/core/src/domain/pages/entities/cells/cards-extended.ts
 * @layer core/domain/pages
 * @description
 * Entité métier CardsExtendedCell.
 */

import type { ContentIconKind } from "@compoz/core/constants/icons/content-icons";

export type CardsExtendedColumns = 1 | 2 | 3;
export type CardsExtendedAlign = "left" | "center";

export type CardsExtendedItem = {
  id: string;
  title: string;
  description: string;
  bullets: ReadonlyArray<string>;
  footer: string | null;
  icon: ContentIconKind | null;
};

export type CardsExtendedCell = {
  id: string;
  kind: "cardsExtended";
  cssClassName?: string;
  columns: CardsExtendedColumns;
  align: CardsExtendedAlign;
  reveal: boolean;
  items: ReadonlyArray<CardsExtendedItem>;
};
