/**
 * @file packages/core/src/domain/site/defaults/legal-menu.ts
 * @layer core/domain
 * @description
 * Valeurs par défaut **métier** pour la configuration du menu légal (`LegalMenuSettings`).
 * Utilisées lors de l’initialisation d’un site ou en absence de configuration persistée.
 *
 * Invariant : configuration déclarative uniquement (aucune logique, aucun fallback).
 */

import type { LegalMenuSettings } from "@compoz/core/domain/site/entities/legal-menu";

/**
 * Valeur par défaut pour un menu légal vide.
 *
 * @example
 * - `items: []` → aucun élément initial. Les pages légales doivent être
 *   ajoutées explicitement par l’utilisateur ou par un script d’initialisation.
 */
export const DEFAULT_LEGAL_MENU_SETTINGS: LegalMenuSettings = {
  items: [],
};
