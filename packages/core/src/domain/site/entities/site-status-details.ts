/**
 * @file packages/core/src/domain/site/entities/site-status-details.ts
 * @layer core/domain/site/entities
 * @description Read-model DTOs for lazy-loaded site status details.
 */

export type SiteStatusDetailsScope = "dirty" | "all";

export type SiteStatusDetailsQuery = Readonly<{
  scope?: SiteStatusDetailsScope;
  includeBlocks?: boolean;
  pageId?: string | null;
}>;

/** Diff state between draft and published content. */
export type SiteDiffKind = "published" | "new" | "modified" | "deleted";

export type SiteStatusBlockDetails = Readonly<{
  id: string;
  type?: string;
  name?: string;
  diff: SiteDiffKind;
}>;

export type SiteStatusPageDetails = Readonly<{
  id: string;
  slug: string;
  name: string;
  diff: SiteDiffKind;

  /** Lightweight counters used before expanding block-level details. */
  blocks: Readonly<{
    draft: number;
    published: number;
    modified: number;
    new: number;
    deleted: number;
  }>;

  blockItems?: ReadonlyArray<SiteStatusBlockDetails>;
}>;

export type SiteStatusDetails = Readonly<{
  scope: SiteStatusDetailsScope;
  includeBlocks: boolean;
  pages: ReadonlyArray<SiteStatusPageDetails>;
}>;
