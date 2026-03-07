/**
 * @file packages/core/src/domain/site/use-cases/status/get-site-status-details.types.ts
 * @layer core/domain
 * @description
 * Types du use-case `getSiteStatusDetails` : entrée, sortie, dépendances.
 * Définit le contrat **sans logique** (implémentation dans `get-site-status-details.ts`).
 *
 * @remarks
 * - Ce use-case retourne un **read-model** (snapshot KV).
 * - Type canonique côté core = `SiteStatusDetails` (entities).
 */

import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type {
  SiteStatusDetails,
  SiteStatusDetailsQuery,
} from "@compoz/core/domain/site/entities/site-status-details";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";

export type GetSiteStatusDetailsInput = SiteStatusDetailsQuery;

export interface GetSiteStatusDetailsResult {
  details: SiteStatusDetails;
}

export interface GetSiteStatusDetailsDeps {
  pages: PagesRepository;
  site: SiteRepository;
  cache: SiteStatusCachePort;
}
