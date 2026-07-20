/**
 * @file packages/core/src/domain/site/entities/site-index.ts
 * @layer core/domain/site/entities
 * @description Canonical site page index.
 * @remarks
 * Holds the published page summaries for a content state.
 */

import type { PageSummary } from "@compoz/core/domain/pages/entities/page";

export interface SiteIndex {
  /** Canonical page summaries for the content state. */
  pages: ReadonlyArray<PageSummary>;

  /** ISO timestamp of the latest logical index write. */
  updatedAt: string;
}
