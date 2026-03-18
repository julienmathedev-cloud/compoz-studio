/**
 * @file packages/core/src/domain/site/entities/identity.ts
 * @layer core/domain
 * @description
 * Entité métier représentant l’identité du site (titre, slogan, logo, favicon).
 * Définit la forme canonique des réglages côté domaine, sans logique
 * ni valeurs par défaut (voir `defaults/identity.ts`).
 */

import type { AssetUrlOrNull } from "@compoz/core/domain/urls/href";

export interface IdentitySettings {
  /** Titre principal du site (obligatoire). */
  siteName: string;

  /** Slogan du site (null si absent). */
  tagline: string | null;

  /** URL du logo (null si aucun logo). */
  logoUrl: AssetUrlOrNull;

  /** Texte alternatif du logo  */
  logoAlt: string;

  /** URL du favicon (null si aucun favicon). */
  faviconUrl: AssetUrlOrNull;
}
