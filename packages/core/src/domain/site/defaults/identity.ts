/**
 * @file packages/core/src/domain/site/defaults/identity.ts
 * @layer core/domain
 * @description
 * Valeurs par défaut **métier** pour la configuration d’identité du site (`IdentitySettings`).
 * Utilisées lors de l’initialisation d’un site ou en absence de configuration persistée.
 *
 * Invariant : defaults déclaratifs uniquement (aucun fallback visuel, aucune logique).
 */

import type { IdentitySettings } from "@compoz/core/domain/site/entities/identity";

/**
 * Valeurs par défaut pour l'identité d’un site.
 */
export const DEFAULT_IDENTITY_SETTINGS: IdentitySettings = {
  siteName: "Compoz",
  tagline: null,
  logo: null,
  faviconUrl: null,
};
