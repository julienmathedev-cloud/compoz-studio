/**
 * @file packages/core/src/domain/site/defaults/primary-menu.ts
 * @layer core/domain
 * @description
 * Valeurs par défaut **métier** pour la configuration du menu principal (`PrimaryMenuSettings`).
 * Le menu est initialisé vide ; l’UI admin est responsable d’ajouter les entrées.
 *
 * Invariant : configuration déclarative uniquement (aucune logique).
 */

import type { PrimaryMenuSettings } from "@compoz/core/domain/site/entities/primary-menu";

/**
 * Valeur par défaut pour un menu principal vide.
 *
 * @example
 * - `items: []` → aucune entrée initiale ; l’utilisateur construit le menu via l’admin.
 */
export const DEFAULT_PRIMARY_MENU_SETTINGS: PrimaryMenuSettings = {
  items: [],
};
