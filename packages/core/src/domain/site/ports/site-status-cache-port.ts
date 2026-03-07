/**
 * @file packages/core/src/domain/site/ports/site-status-cache-port.ts
 * @layer core/domain
 *
 * @description
 * Port cache “read-model” pour le statut du site (snapshots KV).
 *
 * Objectif : réduire au minimum les READ sur les endpoints status / statusDetails
 * via des snapshots lazy (read-through cache) + invalidation côté WRITE.
 *
 * @remarks
 * - Type canonique côté core = read-model "entities" (`SiteStatus`, `SiteStatusDetails`).
 * - La sérialisation JSON (KV) est une responsabilité infra.
 */

import type { SiteStatus } from "@compoz/core/domain/site/entities/site-status";
import type {
  SiteStatusDetails,
  SiteStatusDetailsQuery,
} from "@compoz/core/domain/site/entities/site-status-details";

export interface SiteStatusCachePort {
  /* ------------------------------------------------------------------------ */
  /* Status snapshot (overview)                                               */
  /* ------------------------------------------------------------------------ */

  readStatusSnapshot(): Promise<SiteStatus | null>;
  putStatusSnapshot(status: SiteStatus): Promise<void>;

  /* ------------------------------------------------------------------------ */
  /* StatusDetails snapshots (lazy table)                                     */
  /* ------------------------------------------------------------------------ */

  readStatusDetailsSnapshot(
    query: SiteStatusDetailsQuery,
  ): Promise<SiteStatusDetails | null>;

  putStatusDetailsSnapshot(
    query: SiteStatusDetailsQuery,
    details: SiteStatusDetails,
  ): Promise<void>;

  /* ------------------------------------------------------------------------ */
  /* Invalidation                                                             */
  /* ------------------------------------------------------------------------ */

  /** Invalide le snapshot status (overview). */
  invalidateStatus(): Promise<void>;

  /**
   * Invalide tous les snapshots statusDetails connus (indexés).
   * Stratégie premium : on maintient un index de clés.
   */
  invalidateStatusDetails(): Promise<void>;

  /**
   * Invalidation ciblée (optionnelle) : permet de supprimer un snapshot précis
   * sans SMEMBERS/scan (réduction des reads KV).
   */
  invalidateStatusDetailsSnapshot?: (
    query: SiteStatusDetailsQuery,
  ) => Promise<void>;

  /** Invalide status + statusDetails. */
  invalidateAll(): Promise<void>;
}
