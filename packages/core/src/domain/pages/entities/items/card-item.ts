/**
 * @file packages/core/src/domain/pages/entities/items/card-item.ts
 * @layer core/domain/pages
 *
 * @description
 * Domain entity representing a simple card item.
 *
 * @remarks
 * A simple card item contains only the content required to render one card.
 * Layout concerns such as columns, alignment, or reveal behavior are handled
 * by higher-level cells such as `cardCollection` or `carousel`.
 */

import type { ContentIconKind } from "@compoz/core/constants/icons/content-icons";

export type CardItem = {
  id: string;
  title: string;
  description: string;
  icon: ContentIconKind | null;
};
