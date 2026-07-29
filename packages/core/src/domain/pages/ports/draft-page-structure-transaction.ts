/**
 * @file packages/core/src/domain/pages/ports/draft-page-structure-transaction.ts
 * @layer core/domain/pages
 * @description Transaction boundary for Website-scoped draft page structure mutations.
 */

import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";

export type DraftStructureSnapshot = Readonly<{
  index: SiteIndex;
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

export type DraftPageMetadataWrite = Readonly<{
  page: Page;
  metaRevision: number;
}>;

export type DraftMenuRenameExpectedRevisions = Readonly<{
  expectedPrimaryMenuRevision?: number;
  expectedLegalMenuRevision?: number;
}>;

type UpdateDraftPageWrite = Readonly<{
  pageId: string;
  metadata?: DraftPageMetadataWrite;
  menuRenameExpectedRevisions?: DraftMenuRenameExpectedRevisions;
}>;

export type UpdateDraftPageStructureCommand =
  | (UpdateDraftPageWrite &
      Readonly<{
        parentPageId: string | null;
        expectedDraftStructureRevision: number;
      }>)
  | (UpdateDraftPageWrite &
      Readonly<{
        parentPageId?: never;
        expectedDraftStructureRevision?: never;
      }>);

export type UpdateDraftPageStructureResult = DraftStructureSnapshot &
  Readonly<{ page: Page }>;

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
    command: UpdateDraftPageStructureCommand,
  ): Promise<UpdateDraftPageStructureResult>;

  delete(
    command: DeleteDraftPageStructureCommand,
  ): Promise<DraftStructureSnapshot>;
}
