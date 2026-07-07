/**
 * @file packages/core/src/domain/site/use-cases/status/get-site-status-details.types.ts
 * @layer core/domain/site/use-cases/status
 * @description Types for the site status details read use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
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
