/**
 * @file packages/core/src/domain/site/entities/social.ts
 * @layer core/domain
 * @description
 * Entités métier représentant la configuration des liens sociaux du site.
 * La liste est **ordonnée** afin de préserver l’intention d’affichage côté UI.
 *
 * @remarks
 * - La validation (unicité, format des href) est effectuée en amont (schemas / UI).
 * - Aucun default ni logique métier (voir `defaults/social.ts`).
 */

import type { SocialKind } from "@compoz/core/constants/social/social-kinds";
import type { BrandedHref } from "@compoz/core/domain/urls/href";

/** Élément individuel d’un lien social. */
export interface SocialItem {
  /** Identifiant stable de l’item. */
  id: string;

  /** Plateforme supportée (GitHub, X, LinkedIn, etc.). */
  kind: SocialKind;

  /** Href typé (relatif, absolu http(s), ou mailto). */
  href: BrandedHref;
}

/** Réglages globaux des liens sociaux. */
export interface SocialSettings {
  /** Liste ordonnée des liens sociaux (peut être vide). */
  items: ReadonlyArray<SocialItem>;
}
