/**
 * @file packages/core/src/domain/site/use-cases/header/update-header-settings.types.ts
 * @layer core/domain
 * @description
 * Types du use-case `updateHeaderSettings` : dépendances, entrée (patch + state)
 * et sortie (settings complets). Contrat uniquement, sans logique.
 */

import type { HeaderSettings } from "@compoz/core/domain/site/entities";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

/** Dépendances nécessaires au use-case. */
export interface UpdateHeaderSettingsDeps {
  /** Dépôt agrégat "site" (index + settings). */
  repo: SiteRepository;
}

/**
 * Données d’entrée :
 * - patch partiel sur les réglages du header,
 * - état de contenu optionnel (draft/published).
 */
export interface UpdateHeaderSettingsInput {
  /** Modification partielle appliquée au header (entité domaine). */
  patch: Partial<HeaderSettings>;
}

/** Données de sortie : réglages complets du site après mise à jour. */
export interface UpdateHeaderSettingsResult {
  settings: SiteSettings;
}
