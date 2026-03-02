/**
 * @file packages/core/src/domain/site/use-cases/identity/update-identity-settings.types.ts
 * @layer core/domain
 * @description
 * Types du use-case `updateIdentitySettings` : dépendances, entrée (patch + state)
 * et sortie (settings complets). Contrat uniquement, sans logique.
 */

import type { IdentitySettings } from "@compoz/core/domain/site/entities/identity";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

/** Dépendances injectées dans le use-case. */
export interface UpdateIdentitySettingsDeps {
  /** Dépôt agrégat “site” (index + settings). */
  repo: SiteRepository;
}

/** Données d’entrée : patch shallow + espace logique. */
export interface UpdateIdentitySettingsInput {
  /** Modification partielle appliquée à l’identité du site. */
  patch: Partial<IdentitySettings>;
}

/** Données de sortie : réglages complets après mise à jour. */
export interface UpdateIdentitySettingsResult {
  settings: SiteSettings;
}
