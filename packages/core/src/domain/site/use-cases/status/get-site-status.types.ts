/**
 * @file packages/core/src/domain/site/use-cases/status/get-site-status.types.ts
 * @layer core/domain
 * @description
 * Types du use-case `getSiteStatus` : entrée, sortie, dépendances.
 * Définit le contrat **sans logique** (implémentation dans `get-site-status.ts`).
 */

import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type { SiteStatus } from "@compoz/core/domain/site/entities/site-status";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";

/** Pas d'entrée : état calculé à partir des sources draft/published. */
export type GetSiteStatusInput = Record<string, never>;

/** Sortie : read-model consommé par l'overview admin. */
export interface GetSiteStatusResult {
  status: SiteStatus;
}

/** Dépendances nécessaires au use-case. */
export interface GetSiteStatusDeps {
  pages: PagesRepository;
  site: SiteRepository;
  cache: SiteStatusCachePort;
}
