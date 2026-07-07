/**
 * @file packages/core/src/domain/site/use-cases/identity/update-identity-settings.types.ts
 * @layer core/domain/site/use-cases/identity
 * @description Types for the identity settings update use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { IdentitySettings } from "@compoz/core/domain/site/entities/identity";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

export interface UpdateIdentitySettingsDeps {
  repo: SiteRepository;
}

export interface UpdateIdentitySettingsInput {
  patch: Partial<IdentitySettings>;
}

export interface UpdateIdentitySettingsResult {
  settings: SiteSettings;
}
