/**
 * @file packages/core/src/domain/pages/ports/pages-repository.ts
 * @layer core/domain/pages
 * @description Persistence port for the Page aggregate.
 * @remarks
 * Repository contracts stay independent from transport and storage mechanisms. V1 uses stable page IDs as primary keys and slugs for readable lookups and uniqueness checks.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type {
  Page,
  PageWithRevisions,
} from "@compoz/core/domain/pages/entities/page";

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

  /** Slug uniqueness is enforced by use cases through `readBySlug` / `existsBySlug`. */
  put(state: ContentState, page: Page): Promise<void>;

  /** Batch write must be idempotent and treat an empty `pages` array as a no-op. */
  putMany(state: ContentState, pages: ReadonlyArray<Page>): Promise<void>;

  /** Deletes by id without failing when the page no longer exists. */
  deleteById(state: ContentState, pageId: string): Promise<void>;

  existsById(state: ContentState, pageId: string): Promise<boolean>;

  /** Used by creation and slug update flows to enforce slug uniqueness. */
  existsBySlug(state: ContentState, slug: string): Promise<boolean>;
}
