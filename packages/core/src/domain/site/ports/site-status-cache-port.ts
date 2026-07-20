/**
 * @file packages/core/src/domain/site/ports/site-status-cache-port.ts
 * @layer core/domain/site/ports
 * @description Cache port for site status read-model snapshots.
 * @remarks
 * Core owns the read-model contracts; JSON serialization and KV storage belong to infra.
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

  /** Invalidates the overview status snapshot. Returns whether the invalidation completed successfully. */

  invalidateStatus(): Promise<boolean>;

  /** Invalidates all indexed status details snapshots. Returns whether the invalidation completed successfully. */

  invalidateStatusDetails(): Promise<boolean>;

  /** Optional targeted invalidation to avoid scanning indexed detail snapshots. Returns whether the invalidation completed successfully. */

  invalidateStatusDetailsSnapshot?: (
    query: SiteStatusDetailsQuery,
  ) => Promise<boolean>;

  /** Invalidates every status cache snapshot. Returns whether the invalidation completed successfully. */

  invalidateAll(): Promise<boolean>;
}
