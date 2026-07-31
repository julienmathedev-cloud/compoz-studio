/**
 * @file packages/core/src/domain/site/use-cases/seo/update-seo-settings.types.ts
 * @layer core/domain/site/use-cases/seo
 * @description Types for the SEO settings update use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { SeoSettings } from "@compoz/core/domain/site/entities/seo";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";

export interface UpdateSeoSettingsDeps {
  repo: SiteRepository;
}

export interface UpdateSeoSettingsInput {
  baseline: SeoSettings;
  patch: Partial<SeoSettings>;
  expectedRevision?: number;
}

export interface UpdateSeoSettingsResult {
  outcome: MutationOutcome;
  settings: SeoSettings;
  revision: number;
}
