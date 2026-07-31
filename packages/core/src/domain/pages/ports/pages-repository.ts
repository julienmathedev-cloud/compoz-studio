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

export type CompareAndSetDraftPageBlocksInput = Readonly<{
  pageId: string;
  expectedBlocksRevision: number;
  blocks: ReadonlyArray<Block>;
  metaUpdatedAt: string;
}>;

/** Lightweight page metadata required to build a public sitemap entry. */
export type PageSitemapMetadata = Readonly<{
  id: string;
  sitemap: PageSitemap | null;
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

  /**
   * Lightweight batch read for sitemap generation. Results preserve `pageIds`
   * order and return `null` for empty, missing, or out-of-scope identifiers.
   */
  readManySitemapMetadataById(
    state: ContentState,
    pageIds: ReadonlyArray<string>,
  ): Promise<Array<PageSitemapMetadata | null>>;

  compareAndSetDraftPageBlocks(
    input: CompareAndSetDraftPageBlocksInput,
  ): Promise<boolean>;

  existsById(state: ContentState, pageId: string): Promise<boolean>;

  /** Used by creation and slug update flows to enforce slug uniqueness. */
  existsBySlug(state: ContentState, slug: string): Promise<boolean>;
}
