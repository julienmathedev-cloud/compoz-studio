/**
 * @file packages/core/src/domain/site/use-cases/primary-menu/update-primary-menu-settings.types.ts
 * @layer core/domain/site/use-cases/primary-menu
 * @description Types for the primary menu settings update use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { PrimaryMenuSettings } from "@compoz/core/domain/site/entities/primary-menu";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";

export interface UpdatePrimaryMenuSettingsDeps {
  repo: SiteRepository;
}

export interface UpdatePrimaryMenuSettingsInput {
  baseline: PrimaryMenuSettings;
  patch: Partial<PrimaryMenuSettings>;
  expectedRevision?: number;
}

export interface UpdatePrimaryMenuSettingsResult {
  outcome: MutationOutcome;
  settings: PrimaryMenuSettings;
  revision: number;
}
