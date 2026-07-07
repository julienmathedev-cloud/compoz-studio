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
  SiteSettingsDTO,
  SocialSettingsDTO,
  ThemeSettingsDTO,
} from "@compoz/core/domain/site/dto";

export type GetSettingsBundleResponse = Readonly<{
  settings: SiteSettingsDTO;
}>;

type HeaderSettingsResponse = Readonly<{ settings: HeaderSettingsDTO }>;
export type GetHeaderResponse = HeaderSettingsResponse;
export type PatchHeaderResponse = HeaderSettingsResponse;

type FooterSettingsResponse = Readonly<{ settings: FooterSettingsDTO }>;
export type GetFooterResponse = FooterSettingsResponse;
export type PatchFooterResponse = FooterSettingsResponse;

type IdentitySettingsResponse = Readonly<{ settings: IdentitySettingsDTO }>;
export type GetIdentityResponse = IdentitySettingsResponse;
export type PatchIdentityResponse = IdentitySettingsResponse;

type PrimaryMenuSettingsResponse = Readonly<{
  settings: PrimaryMenuSettingsDTO;
}>;
export type GetPrimaryMenuResponse = PrimaryMenuSettingsResponse;
export type PatchPrimaryMenuResponse = PrimaryMenuSettingsResponse;

type LegalMenuSettingsResponse = Readonly<{ settings: LegalMenuSettingsDTO }>;
export type GetLegalMenuResponse = LegalMenuSettingsResponse;
export type PatchLegalMenuResponse = LegalMenuSettingsResponse;

type SeoSettingsResponse = Readonly<{ settings: SeoSettingsDTO }>;
export type GetSeoResponse = SeoSettingsResponse;
export type PatchSeoResponse = SeoSettingsResponse;

type SocialSettingsResponse = Readonly<{ settings: SocialSettingsDTO }>;
export type GetSocialResponse = SocialSettingsResponse;
export type PatchSocialResponse = SocialSettingsResponse;

type ThemeSettingsResponse = Readonly<{ settings: ThemeSettingsDTO }>;
export type GetThemeResponse = ThemeSettingsResponse;
export type PatchThemeResponse = ThemeSettingsResponse;
