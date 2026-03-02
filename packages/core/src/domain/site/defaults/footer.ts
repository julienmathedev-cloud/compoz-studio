/**
 * @file packages/core/src/domain/site/defaults/footer.ts
 * @layer core/domain
 * @description
 * Valeurs par défaut **métier** pour la configuration du footer (`FooterSettings`).
 * Utilisées lors de l’initialisation d’un site ou en absence de configuration persistée.
 *
 * Invariant : objet statique uniquement (aucune logique).
 */

import type { FooterSettings } from "@compoz/core/domain/site/entities/footer";

/**
 * Valeurs par défaut d’un footer minimal.
 *
 * @example
 * - `copyright` vide → l’utilisateur pourra saisir son propre texte
 * - `showYear: true` → meilleure UX avec l’année automatique
 */
export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  copyright: "Compoz",
  showYear: true, // affichage automatique de l'année courante
};
