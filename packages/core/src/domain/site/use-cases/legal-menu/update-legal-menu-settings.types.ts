/**
 * @file packages/core/src/domain/site/use-cases/legal-menu/update-legal-menu-settings.types.ts
 * @layer core/domain/site/use-cases/legal-menu
 * @description Types for the legal menu settings update use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { LegalMenuSettings } from "@compoz/core/domain/site/entities/legal-menu";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

export interface UpdateLegalMenuSettingsDeps {
  repo: SiteRepository;
}

export interface UpdateLegalMenuSettingsInput {
  /** Shallow patch applied to the persisted legal menu settings. */
  patch: Partial<LegalMenuSettings>;
}

export interface UpdateLegalMenuSettingsResult {
  settings: SiteSettings;
}
