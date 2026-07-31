/**
 * @file packages/core/src/domain/site/use-cases/identity/update-identity-settings.types.ts
 * @layer core/domain/site/use-cases/identity
 * @description Types for the identity settings update use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { IdentitySettings } from "@compoz/core/domain/site/entities/identity";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";

export interface UpdateIdentitySettingsDeps {
  repo: SiteRepository;
}

export interface UpdateIdentitySettingsInput {
  baseline: IdentitySettings;
  patch: Partial<IdentitySettings>;
  expectedRevision?: number;
}

export interface UpdateIdentitySettingsResult {
  outcome: MutationOutcome;
  settings: IdentitySettings;
  revision: number;
}
