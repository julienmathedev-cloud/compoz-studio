/**
 * @file packages/core/src/domain/pages/entities/items/card-item.ts
 * @layer core/domain/pages
 * @description Simple card item domain entity.
 * @remarks
 * Layout concerns are handled by higher-level cells such as `cardCollection` or `carousel`.
 */

import type { ContentIconKind } from "@compoz/core/constants/icons/content-icons";

export type CardItem = {
  id: string;
  title: string;
  description: string;
  icon: ContentIconKind | null;
};
