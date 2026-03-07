/**
 * @file packages/core/src/domain/site/defaults/social.ts
 * @layer core/domain
 * @description
 * Valeurs par défaut **métier** pour la configuration des liens sociaux (`SocialSettings`).
 * Les liens sont initialisés avec une liste vide afin de laisser la configuration
 * entièrement à l’utilisateur et de rester neutre vis-à-vis des plateformes.
 *
 * Invariant : configuration déclarative uniquement (aucune logique).
 */

import type { SocialSettings } from "@compoz/core/domain/site/entities/social";

/**
 * Valeur par défaut pour la configuration des liens sociaux.
 */
export const DEFAULT_SOCIAL_SETTINGS: SocialSettings = {
  items: [],
};
