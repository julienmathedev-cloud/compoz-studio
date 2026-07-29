/**
 * @file packages/core/src/domain/pages/ports/pages-repository.ts
 * @layer core/domain/pages
 * @description Persistence port for the Page aggregate.
 * @remarks
 * Repository contracts stay independent from transport and storage mechanisms. V1 uses stable page IDs as primary keys and slugs for readable lookups and uniqueness checks.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { Block } from "@compoz/core/domain/pages/entities/block";
import type {
  Page,
  PageSitemap,
  PageWithRevisions,
} from "@compoz/core/domain/pages/entities/page";

export type CreateDraftPageInput = Readonly<{
  pageId: string;
  parentId: string | null;
  slug: string;
  name: string;
  seoTitle: string | null;
  seoDescription: string | null;
  blocks: ReadonlyArray<Block>;
  sitemap: PageSitemap | null;
  paginationEnabled: boolean;
  metaCreatedAt: string;
  metaUpdatedAt: string;
}>;

export type UpdateDraftPageMetadataInput = Readonly<{
  pageId: string;
  slug: string;
  name: string;
  seoTitle: string | null;
  seoDescription: string | null;
  sitemap: PageSitemap | null;
  paginationEnabled: boolean;
  metaRevision: number;
  metaUpdatedAt: string;
}>;

export type UpdateDraftPageBlocksInput = Readonly<{
  pageId: string;
  blocks: ReadonlyArray<Block>;
  blocksRevision: number;
  metaUpdatedAt: string;
}>;

export interface PagesRepository {
  /** Idempotently prepares the storage backend when needed. */
  ensureBase(): Promise<void>;

  readById(state: ContentState, pageId: string): Promise<Page | null>;

  readByIdWithRevisions(
    state: ContentState,
    pageId: string,
  ): Promise<PageWithRevisions | null>;

  readBySlug(state: ContentState, slug: string): Promise<Page | null>;

  /**
   * Batch read contract: results must preserve `pageIds` order and return `null` for missing pages.
   */
  readManyById(
    state: ContentState,
    pageIds: ReadonlyArray<string>,
  ): Promise<Array<Page | null>>;

  updateDraftPageMetadata(
    input: UpdateDraftPageMetadataInput,
  ): Promise<void>;

  updateDraftPageBlocks(input: UpdateDraftPageBlocksInput): Promise<void>;

  existsById(state: ContentState, pageId: string): Promise<boolean>;

  /** Used by creation and slug update flows to enforce slug uniqueness. */
  existsBySlug(state: ContentState, slug: string): Promise<boolean>;
}
