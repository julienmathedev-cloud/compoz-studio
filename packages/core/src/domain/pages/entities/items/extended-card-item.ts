/**
 * @file packages/core/src/domain/pages/entities/items/extended-card-item.ts
 * @layer core/domain/pages
 * @description Extended card item domain entity.
 * @remarks
 * Layout concerns are handled by higher-level cells such as `cardCollection` or `carousel`.
 */

import type { ContentIconKind } from "@compoz/core/constants/icons/content-icons";

export type ExtendedCardItem = {
  id: string;
  title: string;
  description: string;
  bullets: ReadonlyArray<string>;
  footer: string | null;
  icon: ContentIconKind | null;
};
