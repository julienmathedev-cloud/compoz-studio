/**
 * @file packages/infra/src/http/studio/site-settings.types.ts
 * @layer infra/http/studio
 * @description
 * DTO SoT des réponses "siteSettings" (Studio).
 *
 * @remarks
 * - Source of truth alignée sur les routes Next côté Studio (préfixées via ENDPOINTS).
 * - Évite d'importer des types depuis `app/api/.../route.ts`
 *   (dépendance framework) dans un package partagé.
 */

import type {
  FooterSettingsDTO,
  HeaderSettingsDTO,
  IdentitySettingsDTO,
  LegalMenuSettingsDTO,
  PrimaryMenuSettingsDTO,
  SeoSettingsDTO,
  SiteSettingsDTO,
  SocialSettingsDTO,
  ThemeSettingsDTO,
} from "@compoz/core/domain/site/dto";

/* -------------------------------------------------------------------------- */
/* Bundle                                                                     */
/* -------------------------------------------------------------------------- */

export type GetSettingsBundleResponse = Readonly<{
  settings: SiteSettingsDTO;
}>;

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

type HeaderSettingsResponse = Readonly<{ settings: HeaderSettingsDTO }>;
export type GetHeaderResponse = HeaderSettingsResponse;
export type PatchHeaderResponse = HeaderSettingsResponse;

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

type FooterSettingsResponse = Readonly<{ settings: FooterSettingsDTO }>;
export type GetFooterResponse = FooterSettingsResponse;
export type PatchFooterResponse = FooterSettingsResponse;

/* -------------------------------------------------------------------------- */
/* Identity                                                                   */
/* -------------------------------------------------------------------------- */

type IdentitySettingsResponse = Readonly<{ settings: IdentitySettingsDTO }>;
export type GetIdentityResponse = IdentitySettingsResponse;
export type PatchIdentityResponse = IdentitySettingsResponse;

/* -------------------------------------------------------------------------- */
/* Menus                                                                      */
/* -------------------------------------------------------------------------- */

type PrimaryMenuSettingsResponse = Readonly<{
  settings: PrimaryMenuSettingsDTO;
}>;
export type GetPrimaryMenuResponse = PrimaryMenuSettingsResponse;
export type PatchPrimaryMenuResponse = PrimaryMenuSettingsResponse;

type LegalMenuSettingsResponse = Readonly<{ settings: LegalMenuSettingsDTO }>;
export type GetLegalMenuResponse = LegalMenuSettingsResponse;
export type PatchLegalMenuResponse = LegalMenuSettingsResponse;

/* -------------------------------------------------------------------------- */
/* SEO                                                                        */
/* -------------------------------------------------------------------------- */

type SeoSettingsResponse = Readonly<{ settings: SeoSettingsDTO }>;
export type GetSeoResponse = SeoSettingsResponse;
export type PatchSeoResponse = SeoSettingsResponse;

/* -------------------------------------------------------------------------- */
/* Social                                                                     */
/* -------------------------------------------------------------------------- */

type SocialSettingsResponse = Readonly<{ settings: SocialSettingsDTO }>;
export type GetSocialResponse = SocialSettingsResponse;
export type PatchSocialResponse = SocialSettingsResponse;

/* -------------------------------------------------------------------------- */
/* Theme                                                                      */
/* -------------------------------------------------------------------------- */

type ThemeSettingsResponse = Readonly<{ settings: ThemeSettingsDTO }>;
export type GetThemeResponse = ThemeSettingsResponse;
export type PatchThemeResponse = ThemeSettingsResponse;
