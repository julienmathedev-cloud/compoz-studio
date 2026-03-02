/**
 * @file packages/core/src/domain/site/entities/site-settings.ts
 * @layer core/domain
 * @description
 * Agrégat racine regroupant l’ensemble des réglages du site.
 * Fournit la vue canonique complète utilisée par les use-cases
 * de chargement et d’enregistrement.
 *
 * @remarks
 * - Aucune valeur par défaut (voir `defaults/`).
 * - Aucune logique métier.
 * - Aucune validation.
 */

import type {
  FooterSettings,
  HeaderSettings,
  IdentitySettings,
  LegalMenuSettings,
  PrimaryMenuSettings,
  SeoSettings,
  SocialSettings,
} from "@compoz/core/domain/site/entities";

/** Agrégat principal : source de vérité des réglages du site. */
export interface SiteSettings {
  header: HeaderSettings;
  footer: FooterSettings;
  primaryMenu: PrimaryMenuSettings;
  legalMenu: LegalMenuSettings;
  social: SocialSettings;
  identity: IdentitySettings;
  seo: SeoSettings;
}
