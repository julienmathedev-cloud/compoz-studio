/**
 * @file packages/core/src/domain/site/entities/identity.ts
 * @layer core/domain
 * @description
 * Entité métier représentant l’identité du site (titre, slogan, logo, favicon).
 * Définit la forme canonique des réglages côté domaine, sans logique
 * ni valeurs par défaut (voir `defaults/identity.ts`).
 */

import type { Image } from "@compoz/core/domain/assets/entities/image";
import type { AssetUrlOrNull } from "@compoz/core/domain/urls/href";

export interface IdentitySettings {
  /** Titre principal du site (obligatoire). */
  siteName: string;

  /** Slogan du site (null si absent). */
  tagline: string | null;

  /** Image du logo (null si aucun logo). */
  logo: Image | null;

  /** URL du favicon (null si aucun favicon). */
  faviconUrl: AssetUrlOrNull;
}
