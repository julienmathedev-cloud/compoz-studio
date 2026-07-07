/**
 * @file packages/core/src/domain/site/use-cases/status/get-site-status.types.ts
 * @layer core/domain/site/use-cases/status
 * @description Types for the global site status read use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type { SiteStatus } from "@compoz/core/domain/site/entities/site-status";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";

export interface GetSiteStatusResult {
  status: SiteStatus;
}

export interface GetSiteStatusDeps {
  pages: PagesRepository;
  site: SiteRepository;
  cache: SiteStatusCachePort;
}
