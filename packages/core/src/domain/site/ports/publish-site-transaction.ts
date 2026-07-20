/**
 * @file packages/core/src/domain/site/ports/publish-site-transaction.ts
 * @layer core/domain/site/ports
 * @description Specialized atomic boundary for Draft to Published publication.
 * @remarks
 * The port exposes domain repositories bound to one publication transaction
 * without leaking Prisma transaction types into Core.
 */

import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

export type PublishedSnapshot = Readonly<{
  /** Pages in their final public navigation order. */
  pages: ReadonlyArray<Page>;
  settings: Readonly<SiteSettings>;
  /** Canonical ISO timestamp attached to the successful publication commit. */
  publishedAt: string;
}>;

export interface PublishSiteTransactionContext {
  /** Transaction-bound repositories used to read one coherent source snapshot. */
  site: SiteRepository;
  pages: PagesRepository;

  /** Replaces the complete Published snapshot inside the active transaction. */
  replacePublishedSnapshot(snapshot: PublishedSnapshot): Promise<void>;
}

export interface PublishSiteTransaction {
  /**
   * Runs one Draft to Published publication in a Website-scoped transaction.
   * Any thrown error must roll back every persisted publication mutation.
   */
  run<T>(
    operation: (context: PublishSiteTransactionContext) => Promise<T>,
  ): Promise<T>;
}
