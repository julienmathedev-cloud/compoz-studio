/**
 * @file packages/core/src/domain/site/ports/site-status-cache-port.ts
 * @layer core/domain/site/ports
 * @description Cache port for site status read-model snapshots.
 * @remarks
 * Core owns the read-model contracts; JSON serialization and KV storage belong to infra.
 * Snapshots are reconstructible from Prisma and cache operations are best-effort.
 * A false invalidation result means it was not guaranteed: callers must log it
 * while preserving the committed business mutation. A failed invalidation can
 * leave a snapshot readable until its 15-minute TTL expires.
 */

import type { SiteStatus } from "@compoz/core/domain/site/entities/site-status";
import type {
  SiteStatusDetails,
  SiteStatusDetailsQuery,
} from "@compoz/core/domain/site/entities/site-status-details";

export interface SiteStatusCachePort {
  readStatusSnapshot(): Promise<SiteStatus | null>;
  putStatusSnapshot(status: SiteStatus): Promise<void>;

  readStatusDetailsSnapshot(
    query: SiteStatusDetailsQuery,
  ): Promise<SiteStatusDetails | null>;

  putStatusDetailsSnapshot(
    query: SiteStatusDetailsQuery,
    details: SiteStatusDetails,
  ): Promise<void>;

  /** Invalidates the overview status snapshot. Returns whether it was guaranteed. */
  invalidateStatus(): Promise<boolean>;

  /** Invalidates all indexed status details snapshots. Returns whether it was guaranteed. */
  invalidateStatusDetails(): Promise<boolean>;

  /** Invalidates every status cache snapshot. Returns whether each invalidation was guaranteed. */
  invalidateAll(): Promise<boolean>;
}
