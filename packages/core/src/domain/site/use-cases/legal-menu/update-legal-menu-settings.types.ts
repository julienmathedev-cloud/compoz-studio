/**
 * @file packages/core/src/domain/site/use-cases/legal-menu/update-legal-menu-settings.types.ts
 * @layer core/domain
 * @description
 * Types du use-case `updateLegalMenuSettings` : dépendances, entrée (patch + state)
 * et sortie (settings complets). Contrat uniquement, sans logique.
 */

import type { LegalMenuSettings } from "@compoz/core/domain/site/entities/legal-menu";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

/** Dépendances nécessaires au use-case. */
export interface UpdateLegalMenuSettingsDeps {
  /** Dépôt agrégat “site” (index + settings). */
  repo: SiteRepository;
}

/**
 * Données d’entrée :
 * - patch partiel appliqué à `legalMenu`,
 * - état draft/published optionnel.
 */
export interface UpdateLegalMenuSettingsInput {
  /** Modification partielle du menu légal. */
  patch: Partial<LegalMenuSettings>;
}

/** Données de sortie : réglages du site après mise à jour. */
export interface UpdateLegalMenuSettingsResult {
  settings: SiteSettings;
}
