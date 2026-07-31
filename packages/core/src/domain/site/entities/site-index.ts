/**
 * @file packages/core/src/domain/site/entities/site-index.ts
 * @layer core/domain/site/entities
 * @description Lightweight site page index projection.
 * @remarks
 * Rebuilt from persisted Page rows ordered by `position`; it is not a
 * separately persisted aggregate.
 */

import type {
  DraftPageSummary,
  PageSummary,
} from "@compoz/core/domain/pages/entities/page";

export interface SiteIndex {
  /** Lightweight summaries of Page rows for the content state. */
  pages: ReadonlyArray<PageSummary>;

  /** Projection timestamp: Page.updatedAt maximum for Draft, Website.lastPublishedAt for Published. */
  updatedAt: string;
}

/** Draft projection carrying Page metadata revisions; Published summaries omit them. */
export interface DraftSiteIndex extends Omit<SiteIndex, "pages"> {
  pages: ReadonlyArray<DraftPageSummary>;
}

/** Draft projection variant carrying the Website-level structure OCC revision. */
export interface DraftSiteIndexWithRevision {
  index: DraftSiteIndex;
  draftStructureRevision: number;
}
