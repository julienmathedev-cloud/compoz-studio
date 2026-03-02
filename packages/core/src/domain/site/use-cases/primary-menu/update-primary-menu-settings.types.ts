/**
 * @file src/core/domain/site/use-cases/primary-menu/update-primary-menu-settings.types.ts
 * @layer core/domain
 * @description
 * Types du use-case `updatePrimaryMenuSettings` : dépendances, entrée (patch + state)
 * et sortie (settings complets). Contrat uniquement, sans logique.
 */

import type { PrimaryMenuSettings } from "@compoz/core/domain/site/entities/primary-menu";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

/** Dépendances nécessaires à l’exécution du use-case. */
export interface UpdatePrimaryMenuSettingsDeps {
  /** Dépôt persistant de l’agrégat Site (index + settings). */
  repo: SiteRepository;
}

/**
 * Données d’entrée :
 * - patch partiel appliqué à l’entité PrimaryMenu
 * - espace logique (draft/published)
 */
export interface UpdatePrimaryMenuSettingsInput {
  patch: Partial<PrimaryMenuSettings>;
}

/** Données de sortie : réglages complets mis à jour. */
export interface UpdatePrimaryMenuSettingsResult {
  settings: SiteSettings;
}
