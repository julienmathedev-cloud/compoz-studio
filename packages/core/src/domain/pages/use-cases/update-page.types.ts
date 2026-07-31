/**
 * @file packages/core/src/domain/pages/use-cases/update-page.types.ts
 * @layer core/domain/pages/use-cases
 * @description Contracts for updating a page through a controlled patch.
 */

import type {
  DraftPageStructureTransaction,
  DraftStructureSnapshot,
  ParentPageChangeIntent,
  UpdatePageMetadataIntent,
} from "@compoz/core/domain/pages/ports/draft-page-structure-transaction";
import type {
  Page,
  PageRevisions,
} from "@compoz/core/domain/pages/entities/page";
import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";

export type {
  MetadataChange,
  PageMetadataChanges,
  ParentPageChangeIntent,
  UpdatePageMetadataIntent,
} from "@compoz/core/domain/pages/ports/draft-page-structure-transaction";

export type UpdatePageIntent = Readonly<{
  metadataChanges?: UpdatePageMetadataIntent;
  parentChange?: ParentPageChangeIntent;
}>;

export type UpdatePageInput = UpdatePageIntent &
  Readonly<{
    pageId: string;
  }>;

export interface UpdatePageResult {
  outcome: MutationOutcome;
  slugChanged: boolean;
  page: Page;
  revisions: PageRevisions;
  structure?: DraftStructureSnapshot;
}

export interface UpdatePageDeps {
  structure: DraftPageStructureTransaction;
}
