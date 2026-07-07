/**
 * @file packages/core/src/domain/site/use-cases/seo/update-seo-settings.types.ts
 * @layer core/domain/site/use-cases/seo
 * @description Types for the SEO settings update use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { SeoSettings } from "@compoz/core/domain/site/entities/seo";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

export interface UpdateSeoSettingsDeps {
  repo: SiteRepository;
}

export interface UpdateSeoSettingsInput {
  /** Shallow patch applied to the persisted SEO settings. */
  patch: Partial<SeoSettings>;
}

export interface UpdateSeoSettingsResult {
  settings: SiteSettings;
}
