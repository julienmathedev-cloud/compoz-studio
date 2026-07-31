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
import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";

export type GetSettingsBundleResponse = SiteSettingsWithRevisionsDTO;

type HeaderSettingsResponse = Readonly<{ settings: HeaderSettingsDTO; revision: number }>;
export type GetHeaderResponse = HeaderSettingsResponse;
export type PatchHeaderResponse = HeaderSettingsResponse & Readonly<{ outcome: MutationOutcome }>;

type FooterSettingsResponse = Readonly<{
  settings: FooterSettingsDTO;
  revision: number;
}>;
export type GetFooterResponse = FooterSettingsResponse;
export type PatchFooterResponse = FooterSettingsResponse & Readonly<{ outcome: MutationOutcome }>;

type IdentitySettingsResponse = Readonly<{ settings: IdentitySettingsDTO; revision: number }>;
export type GetIdentityResponse = IdentitySettingsResponse;
export type PatchIdentityResponse = IdentitySettingsResponse & Readonly<{ outcome: MutationOutcome }>;

type PrimaryMenuSettingsResponse = Readonly<{ settings: PrimaryMenuSettingsDTO; revision: number }>;
export type GetPrimaryMenuResponse = PrimaryMenuSettingsResponse;
export type PatchPrimaryMenuResponse = PrimaryMenuSettingsResponse & Readonly<{ outcome: MutationOutcome }>;

type LegalMenuSettingsResponse = Readonly<{ settings: LegalMenuSettingsDTO; revision: number }>;
export type GetLegalMenuResponse = LegalMenuSettingsResponse;
export type PatchLegalMenuResponse = LegalMenuSettingsResponse & Readonly<{ outcome: MutationOutcome }>;

type SeoSettingsResponse = Readonly<{ settings: SeoSettingsDTO; revision: number }>;
export type GetSeoResponse = SeoSettingsResponse;
export type PatchSeoResponse = SeoSettingsResponse & Readonly<{ outcome: MutationOutcome }>;

type SocialSettingsResponse = Readonly<{ settings: SocialSettingsDTO; revision: number }>;
export type GetSocialResponse = SocialSettingsResponse;
export type PatchSocialResponse = SocialSettingsResponse & Readonly<{ outcome: MutationOutcome }>;

type ThemeSettingsResponse = Readonly<{ settings: ThemeSettingsDTO; revision: number }>;
export type GetThemeResponse = ThemeSettingsResponse;
export type PatchThemeResponse = ThemeSettingsResponse & Readonly<{ outcome: MutationOutcome }>;
