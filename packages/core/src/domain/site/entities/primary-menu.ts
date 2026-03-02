/**
 * @file packages/core/src/domain/site/entities/primary-menu.ts
 * @layer core/domain
 * @description
 * Entités métier représentant la configuration du menu principal du site.
 * Définit une structure arborescente simple (racines + sous-items), sans logique
 * ni valeurs par défaut (voir `defaults/primary-menu.ts`).
 *
 * Invariant : la profondeur et la cohérence sont contrôlées par la validation et l’UI.
 */

import type { AssetUrl } from "@compoz/core/domain/urls/href";

/**
 * Élément du menu principal (racine ou sous-item).
 */
export interface PrimaryMenuItem {
  /** Texte affiché dans le menu. */
  label: string;

  /** URL interne ou externe (`/path` ou `https://...`). */
  href: AssetUrl;

  /** Ouvre le lien dans un nouvel onglet. */
  newTab: boolean;

  /** Sous-items éventuels (tableau toujours présent). */
  children: ReadonlyArray<PrimaryMenuItem>;
}

/**
 * Structure complète du menu principal.
 */
export interface PrimaryMenuSettings {
  /** Liste d’items racines (éventuellement vide). */
  items: ReadonlyArray<PrimaryMenuItem>;
}
