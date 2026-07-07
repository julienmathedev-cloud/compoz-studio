/**
 * @file packages/core/src/domain/site/defaults/legal-menu.ts
 * @layer core/domain/site/defaults
 * @description Default legal menu settings.
 * @remarks
 * Keep this file declarative: no fallback or runtime logic belongs here.
 */

import type { LegalMenuSettings } from "@compoz/core/domain/site/entities/legal-menu";

export const DEFAULT_LEGAL_MENU_SETTINGS: LegalMenuSettings = {
  items: [],
};
