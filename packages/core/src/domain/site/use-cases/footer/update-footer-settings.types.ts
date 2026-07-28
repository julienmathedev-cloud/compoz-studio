/**
 * @file packages/core/src/domain/site/use-cases/footer/update-footer-settings.types.ts
 * @layer core/domain/site/use-cases/footer
 * @description Types for the footer settings update use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { FooterSettings } from "@compoz/core/domain/site/entities";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

export interface UpdateFooterSettingsDeps {
  repo: SiteRepository;
}

export interface UpdateFooterSettingsInput {
  baseline: FooterSettings;
  patch: Partial<FooterSettings>;
  expectedRevision?: number;
}

export interface UpdateFooterSettingsResult {
  settings: FooterSettings;
  revision: number;
}
