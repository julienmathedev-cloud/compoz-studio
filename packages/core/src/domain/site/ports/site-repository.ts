/**
 * @file packages/core/src/domain/site/ports/site-repository.ts
 * @layer core/domain/site/ports
 * @description Storage-agnostic persistence port for the site aggregate.
 * @remarks
 * The repository owns both the page index order and site settings for each content state.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";

/** Persistence contract for the site aggregate. */
export interface SiteRepository {
  /** Idempotently prepares the backing storage. */
  ensureBase(): Promise<void>;

  /** Reads the ordered page index for a content state. */
  readIndex(state: ContentState): Promise<Readonly<SiteIndex>>;

  /** Replaces the ordered page index for a content state. */
  putIndex(state: ContentState, index: Readonly<SiteIndex>): Promise<void>;

  readSettings(state: ContentState): Promise<Readonly<SiteSettings>>;

  putSettings(
    state: ContentState,
    settings: Readonly<SiteSettings>,
  ): Promise<void>;
}
