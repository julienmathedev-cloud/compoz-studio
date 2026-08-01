/**
 * @file packages/core/src/domain/site/use-cases/publish/publish-site.types.ts
 * @layer core/domain/site/use-cases/publish
 * @description Types for the publish site use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { PublishSiteTransaction } from "@compoz/core/domain/site/ports/publish-site-transaction";
import type { PublishWarning } from "@compoz/core/domain/site/validators/publish";

/**
 * Infrastructure hook for public revalidation after publication.
 * @remarks
 * Keep framework-specific APIs outside the domain layer.
 */
export interface PublicRevalidator {
  revalidatePublished(params: { slugs: ReadonlyArray<string> }): Promise<void>;
}

/** Runtime context injected by the application layer. */
export interface PublishSiteRuntime {
  /** Prevents the domain layer from reading `process.env`. */
  isProd: boolean;
}

export interface PublishSiteDeps {
  transaction: PublishSiteTransaction;
  runtime: PublishSiteRuntime;
  /** Injectable clock so published snapshots remain deterministic in tests. */
  nowIso?: () => string;
  /** Optional infra-side revalidation to avoid coupling core to a web framework. */
  revalidator?: PublicRevalidator;
}

export interface PublishSiteInput {
  from?: ContentState;
  to?: ContentState;
  /** Exact Published snapshots require orphan cleanup; `false` is rejected. */
  cleanOrphans?: boolean;
}

export interface PublishSiteResult {
  pagesCopied: number;
  settingsCopied: boolean;
  /** Non-blocking publication warnings. */
  warnings: PublishWarning[];
  from: ContentState;
  to: ContentState;
}
