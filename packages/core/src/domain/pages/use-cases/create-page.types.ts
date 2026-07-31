/**
 * @file packages/core/src/domain/pages/use-cases/create-page.types.ts
 * @layer core/domain/pages/use-cases
 * @description Contracts for creating a page.
 */

import type {
  Page,
  PageRevisions,
  PageSitemap,
} from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type {
  DraftPageStructureTransaction,
  DraftStructureSnapshot,
} from "@compoz/core/domain/pages/ports/draft-page-structure-transaction";
import type { IdGenerator } from "@compoz/core/domain/ports/id-generator";

export interface CreatePageDeps {
  pages: PagesRepository;
  structure: DraftPageStructureTransaction;
  idGenerator: IdGenerator;

  /** Optional ISO clock override. */
  nowIso?: () => string;
}

/** Pages are always created in draft; publication is handled by a dedicated use case. */
export type CreatePageInput = {
  name: string;
  slug?: string;
  seoTitle: string | null;
  seoDescription: string | null;
  parentId: string | null;
  sitemap: Partial<PageSitemap> | null;
  existingSlugs?: ReadonlySet<string>;
  paginationEnabled: boolean;
  expectedDraftStructureRevision: number;
};

export interface CreatePageResult extends DraftStructureSnapshot {
  page: Page;
  revisions: PageRevisions;
}
