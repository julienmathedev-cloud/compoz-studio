/**
 * @file packages/core/src/domain/site/entities/header.ts
 * @layer core/domain
 * @description
 * Entité métier représentant la configuration du header du site.
 * Définit la forme canonique des réglages côté domaine, sans logique
 * ni valeurs par défaut (voir `defaults/header.ts`).
 */

export interface HeaderSettings {
  /** Affiche le logo du site si disponible. */
  showLogo: boolean;

  /** Affiche le titre du site (fallback du logo). */
  showSiteName: boolean;

  /** Rend le header collant (fixé en haut de l’écran). */
  sticky: boolean;

  /** Active un effet de flou d’arrière-plan. */
  blur: boolean;

  /** Inverse l’ordre navigation principale ↔ liens sociaux. */
  swapPrimaryAndSocial: boolean;
}
