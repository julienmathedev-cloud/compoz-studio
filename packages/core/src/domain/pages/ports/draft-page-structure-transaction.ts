/**
 * @file packages/core/src/domain/pages/ports/draft-page-structure-transaction.ts
 * @layer core/domain/pages
 * @description Transaction boundary for Website-scoped draft page structure mutations.
 */

import type {
  Page,
  PageRevisions,
  PageSitemap,
} from "@compoz/core/domain/pages/entities/page";
import type { DraftSiteIndex } from "@compoz/core/domain/site/entities/site-index";

export type DraftStructureSnapshot = Readonly<{
  index: DraftSiteIndex;
  draftStructureRevision: number;
}>;

export type CreateDraftPageStructureCommand = Readonly<{
  expectedDraftStructureRevision: number;
  page: Page;
}>;

export type CreateDraftPageStructureResult = DraftStructureSnapshot &
  Readonly<{ page: Page }>;

export type ReorderDraftSiblingsCommand = Readonly<{
  parentPageId: string | null;
  orderedPageIds: ReadonlyArray<string>;
  expectedDraftStructureRevision: number;
}>;

export type MetadataChange<T> = Readonly<{
  baseline: T;
  local: T;
}>;

export type PageMetadataChanges = Readonly<{
  name?: MetadataChange<string>;
  slug?: MetadataChange<string>;
  seoTitle?: MetadataChange<string | null>;
  seoDescription?: MetadataChange<string | null>;
  sitemap?: MetadataChange<PageSitemap | null>;
  paginationEnabled?: MetadataChange<boolean>;
}>;

export type UpdatePageMetadataIntent = Readonly<{
  expectedMetaRevision: number;
  changes: PageMetadataChanges;
}>;

export type ParentPageChangeIntent = Readonly<{
  baseline: string | null;
  local: string | null;
  expectedDraftStructureRevision: number;
}>;

export type UpdateDraftPageIntent = Readonly<{
  pageId: string;
  metadataChanges?: UpdatePageMetadataIntent;
  parentChange?: ParentPageChangeIntent;
}>;

export type UpdateDraftPageStructureResult = Readonly<{
  page: Page;
  revisions: PageRevisions;
  structure?: DraftStructureSnapshot;
}>;

export type DeleteDraftPageStructureCommand = Readonly<{
  pageId: string;
  expectedDraftStructureRevision: number;
}>;

export interface DraftPageStructureTransaction {
  create(
    command: CreateDraftPageStructureCommand,
  ): Promise<CreateDraftPageStructureResult>;

  reorder(
    command: ReorderDraftSiblingsCommand,
  ): Promise<DraftStructureSnapshot>;

  update(
    intent: UpdateDraftPageIntent,
  ): Promise<UpdateDraftPageStructureResult>;

  delete(
    command: DeleteDraftPageStructureCommand,
  ): Promise<DraftStructureSnapshot>;
}
