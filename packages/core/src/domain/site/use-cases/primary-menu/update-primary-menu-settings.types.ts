/**
 * @file packages/core/src/domain/site/use-cases/primary-menu/update-primary-menu-settings.types.ts
 * @layer core/domain/site/use-cases/primary-menu
 * @description Types for the primary menu settings update use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { PrimaryMenuSettings } from "@compoz/core/domain/site/entities/primary-menu";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

export interface UpdatePrimaryMenuSettingsDeps {
  repo: SiteRepository;
}

export interface UpdatePrimaryMenuSettingsInput {
  patch: Partial<PrimaryMenuSettings>;
}

export interface UpdatePrimaryMenuSettingsResult {
  settings: SiteSettings;
}
