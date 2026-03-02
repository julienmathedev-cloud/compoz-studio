/**
 * @file packages/core/src/domain/site/ports/site-status-cache-port.ts
 * @layer core/domain
 *
 * @description
 * Port cache “read-model” pour le statut du site (snapshots KV).
 *
 * Objectif : réduire au minimum les READ sur les endpoints status / statusDetails
 * via des snapshots lazy (read-through cache) + invalidation côté WRITE.
 */

import type {
  SiteStatusDTO,
  SiteStatusDetailsDTO,
} from "@compoz/core/domain/site/dto";
import type { SiteStatusDetailsQuery } from "@compoz/core/domain/site/entities/site-status-details";

export interface SiteStatusCachePort {
  /* ------------------------------------------------------------------------ */
  /* Status snapshot (overview)                                               */
  /* ------------------------------------------------------------------------ */

  readStatusSnapshot(): Promise<SiteStatusDTO | null>;
  writeStatusSnapshot(status: SiteStatusDTO): Promise<void>;

  /* ------------------------------------------------------------------------ */
  /* StatusDetails snapshots (lazy table)                                     */
  /* ------------------------------------------------------------------------ */

  readStatusDetailsSnapshot(
    query: SiteStatusDetailsQuery,
  ): Promise<SiteStatusDetailsDTO | null>;

  writeStatusDetailsSnapshot(
    query: SiteStatusDetailsQuery,
    details: SiteStatusDetailsDTO,
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
