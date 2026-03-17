/**
 * @file packages/core/src/domain/site/use-cases/theme/update-theme-settings.types.ts
 * @layer core/domain
 * @description
 * Types du use-case `updateThemeSettings` : dépendances, entrée (patch shallow)
 * et sortie (settings complets). Contrat uniquement, sans logique.
 */

import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { ThemeSettings } from "@compoz/core/domain/site/entities/theme";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

/** Dépendances injectées dans le use-case. */
export interface UpdateThemeSettingsDeps {
  /** Dépôt agrégat “site” (index + settings). */
  repo: SiteRepository;
}

/** Données d’entrée : patch shallow sur les réglages du thème. */
export interface UpdateThemeSettingsInput {
  /** Modification partielle appliquée au thème public du site. */
  patch: Partial<ThemeSettings>;
}

/** Données de sortie : réglages complets après mise à jour. */
export interface UpdateThemeSettingsResult {
  settings: SiteSettings;
}
