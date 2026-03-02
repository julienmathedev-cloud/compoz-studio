/**
 * @file packages/infra/src/http/studio/site-settings.types.ts
 * @layer infra/http
 * @description
 * DTO SoT des réponses "site settings" (admin).
 *
 * @remarks
 * - Source of truth alignée sur les routes Next :
 *   - /api/site/*
 * - Évite d'importer des types depuis `app/api/.../route.ts`
 *   (dépendance framework) dans un package partagé.
 *
 * IMPORTANT :
 * - Remplace les `unknown` par tes vrais DTO si tu les exposes depuis @compoz/core/domain.
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
/** SoT réponse HTTP */
export type GetHeaderResponse = HeaderSettingsResponse;
/** SoT réponse HTTP */
export type PatchHeaderResponse = HeaderSettingsResponse;

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

type FooterSettingsResponse = Readonly<{ settings: FooterSettingsDTO }>;
/** SoT réponse HTTP */
export type GetFooterResponse = FooterSettingsResponse;
/** SoT réponse HTTP */
export type PatchFooterResponse = FooterSettingsResponse;

/* -------------------------------------------------------------------------- */
/* Identity                                                                   */
/* -------------------------------------------------------------------------- */
type IdentitySettingsResponse = Readonly<{ settings: IdentitySettingsDTO }>;
/** SoT réponse HTTP */
export type GetIdentityResponse = IdentitySettingsResponse;
/** SoT réponse HTTP */
export type PatchIdentityResponse = IdentitySettingsResponse;

/* -------------------------------------------------------------------------- */
/* Menus                                                                      */
/* -------------------------------------------------------------------------- */
type PrimaryMenuSettingsResponse = Readonly<{
  settings: PrimaryMenuSettingsDTO;
}>;
/** SoT réponse HTTP */
export type GetPrimaryMenuResponse = PrimaryMenuSettingsResponse;
/** SoT réponse HTTP */
export type PatchPrimaryMenuResponse = PrimaryMenuSettingsResponse;

type LegalMenuSettingsResponse = Readonly<{ settings: LegalMenuSettingsDTO }>;
/** SoT réponse HTTP */
export type GetLegalMenuResponse = LegalMenuSettingsResponse;
/** SoT réponse HTTP */
export type PatchLegalMenuResponse = LegalMenuSettingsResponse;

/* -------------------------------------------------------------------------- */
/* SEO                                                                        */
/* -------------------------------------------------------------------------- */
type SeoSettingsResponse = Readonly<{ settings: SeoSettingsDTO }>;
/** SoT réponse HTTP */
export type GetSeoResponse = SeoSettingsResponse;
/** SoT réponse HTTP */
export type PatchSeoResponse = SeoSettingsResponse;

/* -------------------------------------------------------------------------- */
/* Social                                                                     */
/* -------------------------------------------------------------------------- */
type SocialSettingsResponse = Readonly<{ settings: SocialSettingsDTO }>;
/** SoT réponse HTTP */
export type GetSocialResponse = SocialSettingsResponse;
/** SoT réponse HTTP */
export type PatchSocialResponse = SocialSettingsResponse;
