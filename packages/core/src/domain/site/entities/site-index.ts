/**
 * @file packages/core/src/domain/site/entities/site-index.ts
 * @layer core/domain/site/entities
 * @description Canonical site page index.
 * @remarks
 * `pages[]` order is the source of truth and must not be sorted implicitly.
 */

import type { PageSummary } from "@compoz/core/domain/pages/entities/page";

export interface SiteIndex {
  /** Source-of-truth page order. */
  pages: ReadonlyArray<PageSummary>;
  updatedAt: string;
}
