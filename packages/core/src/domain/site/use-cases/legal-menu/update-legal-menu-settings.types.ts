/**
 * @file packages/core/src/domain/site/use-cases/legal-menu/update-legal-menu-settings.types.ts
 * @layer core/domain/site/use-cases/legal-menu
 * @description Types for the legal menu settings update use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { LegalMenuSettings } from "@compoz/core/domain/site/entities/legal-menu";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

export interface UpdateLegalMenuSettingsDeps {
  repo: SiteRepository;
}

export interface UpdateLegalMenuSettingsInput {
  baseline: LegalMenuSettings;
  patch: Partial<LegalMenuSettings>;
  expectedRevision?: number;
}

export interface UpdateLegalMenuSettingsResult {
  settings: LegalMenuSettings;
  revision: number;
}
