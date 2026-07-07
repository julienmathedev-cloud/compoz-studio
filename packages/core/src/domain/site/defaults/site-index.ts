/**
 * @file packages/core/src/domain/site/defaults/site-index.ts
 * @layer core/domain/site/defaults
 * @description Default empty site index.
 * @remarks
 * `updatedAt` uses a sentinel timestamp to represent an index that has never been updated.
 */

import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";

/** Sentinel timestamp for a never-updated site index. */
export const EPOCH_ISO = "1970-01-01T00:00:00.000Z" as const;

export const DEFAULT_SITE_INDEX: SiteIndex = {
  pages: [],
  updatedAt: EPOCH_ISO,
};
