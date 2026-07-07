/**
 * @file packages/core/src/domain/site/use-cases/footer/update-footer-settings.types.ts
 * @layer core/domain/site/use-cases/footer
 * @description Types for the footer settings update use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { FooterSettings } from "@compoz/core/domain/site/entities";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

export interface UpdateFooterSettingsDeps {
  repo: SiteRepository;
}

export interface UpdateFooterSettingsInput {
  patch: Partial<FooterSettings>;
}

export interface UpdateFooterSettingsResult {
  settings: SiteSettings;
}
