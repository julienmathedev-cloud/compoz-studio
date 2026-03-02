/**
 * @file packages/core/src/domain/site/use-cases/social/update-social-settings.types.ts
 * @layer core/domain
 * @description
 * Types du use-case `updateSocialSettings` : dépendances, entrée (patch + state)
 * et sortie (settings complets). Contrat uniquement, sans logique.
 */

import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SocialSettings } from "@compoz/core/domain/site/entities/social";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

/** Dépendances nécessaires au use-case. */
export interface UpdateSocialSettingsDeps {
  /** Dépôt agrégat “site” (index + settings). */
  repo: SiteRepository;
}

/**
 * Données d’entrée :
 * - patch partiel (shallow) sur les réglages sociaux,
 * - espace logique de contenu (draft/published).
 */
export interface UpdateSocialSettingsInput {
  /**
   * Patch appliqué aux liens sociaux.
   * Exemple : `{ items: [...] }` avec une nouvelle liste normalisée.
   */
  patch: Partial<SocialSettings>;
}

/** Données de sortie : réglages complets après mise à jour. */
export interface UpdateSocialSettingsResult {
  settings: SiteSettings;
}
