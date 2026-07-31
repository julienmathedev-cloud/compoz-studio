/**
 * @file packages/core/src/domain/site/use-cases/social/update-social-settings.types.ts
 * @layer core/domain/site/use-cases/social
 * @description Types for the social settings update use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { SocialSettings } from "@compoz/core/domain/site/entities/social";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";

export interface UpdateSocialSettingsDeps {
  repo: SiteRepository;
}

export interface UpdateSocialSettingsInput {
  baseline: SocialSettings;
  patch: Partial<SocialSettings>;
  expectedRevision?: number;
}

export interface UpdateSocialSettingsResult {
  outcome: MutationOutcome;
  settings: SocialSettings;
  revision: number;
}
