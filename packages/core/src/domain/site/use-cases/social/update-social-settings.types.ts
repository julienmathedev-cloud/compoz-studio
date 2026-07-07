/**
 * @file packages/core/src/domain/site/use-cases/social/update-social-settings.types.ts
 * @layer core/domain/site/use-cases/social
 * @description Types for the social settings update use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SocialSettings } from "@compoz/core/domain/site/entities/social";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

export interface UpdateSocialSettingsDeps {
  repo: SiteRepository;
}

export interface UpdateSocialSettingsInput {
  patch: Partial<SocialSettings>;
}

export interface UpdateSocialSettingsResult {
  settings: SiteSettings;
}
