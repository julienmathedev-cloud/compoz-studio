/**
 * @file packages/core/src/domain/site/entities/site-status.ts
 * @layer core/domain/site/entities
 * @description Read-model DTO for global draft versus published site status.
 * @remarks
 * This is not a domain entity or an RHF shape; it is computed server-side and consumed by the admin overview.
 */

import type { PublishWarning } from "@compoz/core/domain/site/validators/publish";

export type SiteStatus = Readonly<{
  published: Readonly<{
    exists: boolean;
    /** ISO timestamp derived from the published index. */
    lastPublishedAt?: string;
  }>;

  hasChanges: Readonly<{
    site: boolean;
    settings: boolean;
    pages: boolean;
  }>;

  counts: Readonly<{
    pages: Readonly<{
      draft: number;
      published: number;
      modified: number;
      new: number;
      deleted: number;
    }>;
    blocks: Readonly<{
      draft: number;
      published: number;
      modified: number;
      new: number;
      deleted: number;
    }>;
  }>;

  /** Dirty state per settings section, used by the admin overview. */
  changedSettings: Readonly<{
    identity: boolean;
    primaryMenu: boolean;
    legalMenu: boolean;
    social: boolean;
    header: boolean;
    footer: boolean;
    seo: boolean;
    theme: boolean;
  }>;

  /** Non-blocking warnings shown before publication. */
  prePublishWarnings?: ReadonlyArray<PublishWarning>;
}>;
