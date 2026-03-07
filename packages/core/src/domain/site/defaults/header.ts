/**
 * @file packages/core/src/domain/site/defaults/header.ts
 * @layer core/domain
 * @description
 * Valeurs par défaut **métier** pour la configuration du header (`HeaderSettings`).
 * Utilisées lors de l’initialisation d’un site ou en absence de configuration persistée.
 *
 * Invariant : objet statique uniquement (aucune logique).
 */

import type { HeaderSettings } from "@compoz/core/domain/site/entities/header";

/**
 * Valeurs par défaut d’un header minimal.
 */
export const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  showLogo: true,
  showSiteName: false,
  sticky: true,
  blur: false, // fond flouté au scroll (effet esthétique par défaut)
  swapPrimaryAndSocial: false,
};
