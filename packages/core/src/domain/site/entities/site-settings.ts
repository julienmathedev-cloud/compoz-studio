/**
 * @file packages/core/src/domain/site/entities/site-settings.ts
 * @layer core/domain/site/entities
 * @description Canonical aggregate for all site settings.
 * @remarks
 * Defaults, validation, and persistence mapping belong outside this entity.
 */

import type {
  FooterSettings,
  HeaderSettings,
  IdentitySettings,
  LegalMenuSettings,
  PrimaryMenuSettings,
  SeoSettings,
  SocialSettings,
  ThemeSettings,
} from "@compoz/core/domain/site/entities";

export interface SiteSettings {
  header: HeaderSettings;
  footer: FooterSettings;
  primaryMenu: PrimaryMenuSettings;
  legalMenu: LegalMenuSettings;
  social: SocialSettings;
  identity: IdentitySettings;
  seo: SeoSettings;
  theme: ThemeSettings;
}

/** Granular technical revisions for each persisted settings section. */
export interface SiteSettingsRevisions {
  headerRevision: number;
  footerRevision: number;
  identityRevision: number;
  socialRevision: number;
  seoRevision: number;
  themeRevision: number;
  primaryMenuRevision: number;
  legalMenuRevision: number;
}

/** Studio-oriented settings projection keeping revisions out of public data. */
export interface SiteSettingsWithRevisions {
  settings: SiteSettings;
  revisions: SiteSettingsRevisions;
}
