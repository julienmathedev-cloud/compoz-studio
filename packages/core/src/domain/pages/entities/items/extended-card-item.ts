/**
 * @file packages/core/src/domain/pages/entities/items/extended-card-item.ts
 * @layer core/domain/pages
 *
 * @description
 * Domain entity representing an extended card item.
 *
 * @remarks
 * An extended card item provides richer content than a simple card:
 * description, bullet points, optional footer, and optional icon.
 *
 * Layout concerns such as columns, alignment, or reveal behavior are handled
 * by higher-level cells such as `cardCollection` or `carousel`.
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
