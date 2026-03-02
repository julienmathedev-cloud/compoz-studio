/**
 * @file src/core/domain/site/use-cases/footer/update-footer-settings.types.ts
 * @layer core/domain
 * @description
 * Types du use-case `updateFooterSettings` : dépendances, entrée (patch + state)
 * et sortie (settings complets). Contrat uniquement, sans logique.
 */

import type { FooterSettings } from "@compoz/core/domain/site/entities";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

/** Dépendances nécessaires au use-case. */
export interface UpdateFooterSettingsDeps {
  /** Dépôt de persistance de l’agrégat "site" (index + settings). */
  repo: SiteRepository;
}

/**
 * Données d’entrée :
 * - un patch partiel sur les réglages du footer,
 * - un état de contenu optionnel (draft / published).
 */
export interface UpdateFooterSettingsInput {
  /** Modification partielle appliquée au footer (entité domaine). */
  patch: Partial<FooterSettings>;
}

/** Données de sortie : réglages complets du site après mise à jour. */
export interface UpdateFooterSettingsResult {
  settings: SiteSettings;
}
