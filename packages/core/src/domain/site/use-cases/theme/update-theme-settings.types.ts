/**
 * @file packages/core/src/domain/site/use-cases/theme/update-theme-settings.types.ts
 * @layer core/domain/site/use-cases/theme
 * @description Types for the theme settings update use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { ThemeSettings } from "@compoz/core/domain/site/entities/theme";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";

export interface UpdateThemeSettingsDeps {
  repo: SiteRepository;
}

export interface UpdateThemeSettingsInput {
  baseline: ThemeSettings;
  patch: Partial<ThemeSettings>;
  expectedRevision?: number;
}

export interface UpdateThemeSettingsResult {
  outcome: MutationOutcome;
  settings: ThemeSettings;
  revision: number;
}
