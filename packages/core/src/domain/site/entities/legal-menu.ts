/**
 * @file packages/core/src/domain/site/entities/legal-menu.ts
 * @layer core/domain
 * @description
 * Entités métier représentant la configuration du menu légal du site.
 * Définit une liste plate d’items avec des URLs déjà normalisées côté domaine
 * (`AssetUrl`), sans logique ni valeurs par défaut.
 */

import type { AssetUrl } from "@compoz/core/domain/urls/href";

/**
 * Item individuel du menu légal.
 */
export interface LegalMenuItem {
  /** Libellé affiché dans le menu. */
  label: string;

  /** URL de destination (interne ou externe), déjà brandée en AssetUrl. */
  href: AssetUrl;

  /** Ouvre le lien dans un nouvel onglet (`target="_blank"`). */
  newTab: boolean;
}

/**
 * Réglages du menu légal pour un site.
 */
export interface LegalMenuSettings {
  /** Liste d’items du menu légal (éventuellement vide). */
  items: ReadonlyArray<LegalMenuItem>;
}
