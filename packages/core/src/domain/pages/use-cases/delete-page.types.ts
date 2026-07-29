/**
 * @file packages/core/src/domain/pages/use-cases/delete-page.types.ts
 * @layer core/domain/pages/use-cases
 * @description Contracts for deleting a page.
 */

import type {
  DraftPageStructureTransaction,
  DraftStructureSnapshot,
} from "@compoz/core/domain/pages/ports/draft-page-structure-transaction";

export interface DeletePageInput {
  pageId: string;
  expectedDraftStructureRevision: number;
}

export type DeletePageResult = DraftStructureSnapshot;

export interface DeletePageDeps {
  structure: DraftPageStructureTransaction;
}
