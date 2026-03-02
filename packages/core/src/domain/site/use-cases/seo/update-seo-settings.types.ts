/**
 * @file packages/core/src/domain/site/use-cases/seo/update-seo-settings.types.ts
 * @layer core/domain
 * @description
 * Types du use-case `updateSeoSettings` : dépendances, entrée (patch)
 * et sortie (settings complets). Contrat uniquement, sans logique.
 */

import type { SeoSettings } from "@compoz/core/domain/site/entities/seo";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

/** Dépendances nécessaires au use-case. */
export interface UpdateSeoSettingsDeps {
  /** Dépôt agrégat “site” (index + settings). */
  repo: SiteRepository;
}

/**
 * Données d’entrée :
 * - patch partiel sur les réglages SEO.
 */
export interface UpdateSeoSettingsInput {
  /** Modification partielle appliquée à `settings.seo`. */
  patch: Partial<SeoSettings>;
}

/** Données de sortie : réglages complets après mise à jour. */
export interface UpdateSeoSettingsResult {
  settings: SiteSettings;
}
