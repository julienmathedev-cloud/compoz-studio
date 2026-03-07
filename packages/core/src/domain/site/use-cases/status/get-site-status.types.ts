/**
 * @file packages/core/src/domain/site/use-cases/status/get-site-status.types.ts
 * @layer core/domain
 * @description
 * Types du use-case `getSiteStatus` : sortie, dépendances.
 * Définit le contrat **sans logique** (implémentation dans `get-site-status.ts`).
 *
 * @remarks
 * - Ce use-case retourne un **read-model** (snapshot KV).
 * - Type canonique côté core = `SiteStatus` (entities).
 */

import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type { SiteStatus } from "@compoz/core/domain/site/entities/site-status";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";

/** Sortie : read-model consommé par l'overview Studio. */
export interface GetSiteStatusResult {
  status: SiteStatus;
}

/** Dépendances nécessaires au use-case. */
export interface GetSiteStatusDeps {
  pages: PagesRepository;
  site: SiteRepository;
  cache: SiteStatusCachePort;
}
