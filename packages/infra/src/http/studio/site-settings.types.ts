/**
 * @file packages/infra/src/http/studio/site-settings.types.ts
 * @layer infra/http/studio
 * @description DTO contracts for Studio site settings endpoints.
 * @remarks
 * These DTOs stay aligned with Studio HTTP routes without importing from `app/api`.
 */

import type {
  FooterSettingsDTO,
  HeaderSettingsDTO,
  IdentitySettingsDTO,
  LegalMenuSettingsDTO,
  PrimaryMenuSettingsDTO,
  SeoSettingsDTO,
  SiteSettingsWithRevisionsDTO,
  SocialSettingsDTO,
  ThemeSettingsDTO,
} from "@compoz/core/domain/site/dto";

export type GetSettingsBundleResponse = SiteSettingsWithRevisionsDTO;

type HeaderSettingsResponse = Readonly<{ settings: HeaderSettingsDTO; revision: number }>;
export type GetHeaderResponse = HeaderSettingsResponse;
export type PatchHeaderResponse = HeaderSettingsResponse;

type FooterSettingsResponse = Readonly<{
  settings: FooterSettingsDTO;
  revision: number;
}>;
export type GetFooterResponse = FooterSettingsResponse;
export type PatchFooterResponse = FooterSettingsResponse;

type IdentitySettingsResponse = Readonly<{ settings: IdentitySettingsDTO; revision: number }>;
export type GetIdentityResponse = IdentitySettingsResponse;
export type PatchIdentityResponse = IdentitySettingsResponse;

type PrimaryMenuSettingsResponse = Readonly<{ settings: PrimaryMenuSettingsDTO; revision: number }>;
export type GetPrimaryMenuResponse = PrimaryMenuSettingsResponse;
export type PatchPrimaryMenuResponse = PrimaryMenuSettingsResponse;

type LegalMenuSettingsResponse = Readonly<{ settings: LegalMenuSettingsDTO; revision: number }>;
export type GetLegalMenuResponse = LegalMenuSettingsResponse;
export type PatchLegalMenuResponse = LegalMenuSettingsResponse;

type SeoSettingsResponse = Readonly<{ settings: SeoSettingsDTO; revision: number }>;
export type GetSeoResponse = SeoSettingsResponse;
export type PatchSeoResponse = SeoSettingsResponse;

type SocialSettingsResponse = Readonly<{ settings: SocialSettingsDTO; revision: number }>;
export type GetSocialResponse = SocialSettingsResponse;
export type PatchSocialResponse = SocialSettingsResponse;

type ThemeSettingsResponse = Readonly<{ settings: ThemeSettingsDTO; revision: number }>;
export type GetThemeResponse = ThemeSettingsResponse;
export type PatchThemeResponse = ThemeSettingsResponse;
