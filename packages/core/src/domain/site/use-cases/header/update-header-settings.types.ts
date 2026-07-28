/**
 * @file packages/core/src/domain/site/use-cases/header/update-header-settings.types.ts
 * @layer core/domain/site/use-cases/header
 * @description Types for the header settings update use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { HeaderSettings } from "@compoz/core/domain/site/entities";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

export interface UpdateHeaderSettingsDeps {
  repo: SiteRepository;
}

export interface UpdateHeaderSettingsInput {
  baseline: HeaderSettings;
  patch: Partial<HeaderSettings>;
  expectedRevision?: number;
}

export interface UpdateHeaderSettingsResult {
  settings: HeaderSettings;
  revision: number;
}
