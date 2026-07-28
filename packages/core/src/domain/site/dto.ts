/**
 * @file packages/core/src/domain/site/dto.ts
 * @layer core/domain/site
 * @description DTO contracts exposed at site module boundaries.
 * @remarks
 * DTOs currently mirror domain entities through `Readonly`, but may diverge at API or infra boundaries later.
 */

import type {
  FooterSettings,
  HeaderSettings,
  IdentitySettings,
  LegalMenuItem,
  LegalMenuSettings,
  PrimaryMenuItem,
  PrimaryMenuSettings,
  SeoSettings,
  SiteStatus,
  SocialItem,
  SocialSettings,
  ThemeSettings,
} from "@compoz/core/domain/site/entities";
import type {
  DraftSiteIndexWithRevision,
  SiteIndex,
} from "@compoz/core/domain/site/entities/site-index";
import type {
  SiteSettings,
  SiteSettingsRevisions,
} from "@compoz/core/domain/site/entities/site-settings";
import type {
  SiteDiffKind,
  SiteStatusBlockDetails,
  SiteStatusDetails,
  SiteStatusDetailsQuery,
  SiteStatusDetailsScope,
  SiteStatusPageDetails,
} from "@compoz/core/domain/site/entities/site-status-details";
import type { PublishSiteResult } from "@compoz/core/domain/site/use-cases/publish/publish-site.types";

export type SiteIndexDTO = Readonly<SiteIndex>;

export type DraftSiteIndexWithRevisionDTO =
  Readonly<DraftSiteIndexWithRevision>;

export type HeaderSettingsDTO = Readonly<HeaderSettings>;
export type FooterSettingsDTO = Readonly<FooterSettings>;
export type PrimaryMenuSettingsDTO = Readonly<PrimaryMenuSettings>;
export type PrimaryMenuItemDTO = Readonly<PrimaryMenuItem>;
export type LegalMenuSettingsDTO = Readonly<LegalMenuSettings>;
export type LegalMenuItemDTO = Readonly<LegalMenuItem>;
export type SocialSettingsDTO = Readonly<SocialSettings>;
export type SocialItemDTO = Readonly<SocialItem>;
export type IdentitySettingsDTO = Readonly<IdentitySettings>;
export type SeoSettingsDTO = Readonly<SeoSettings>;
export type ThemeSettingsDTO = Readonly<ThemeSettings>;

export type PublishSiteResultDTO = Readonly<PublishSiteResult>;

export type SiteSettingsDTO = Readonly<{
  header: HeaderSettingsDTO;
  footer: FooterSettingsDTO;
  primaryMenu: PrimaryMenuSettingsDTO;
  legalMenu: LegalMenuSettingsDTO;
  social: SocialSettingsDTO;
  identity: IdentitySettingsDTO;
  seo: SeoSettingsDTO;
  theme: ThemeSettingsDTO;
}>;

export type SiteSettingsRevisionsDTO = Readonly<SiteSettingsRevisions>;

export type SiteSettingsWithRevisionsDTO = Readonly<{
  settings: SiteSettingsDTO;
  revisions: SiteSettingsRevisionsDTO;
}>;

/** Write DTO currently aligned with the full domain aggregate, not PATCH semantics. */
export type WriteSiteSettingsDTO = Readonly<SiteSettings>;

export type SiteStatusDTO = Readonly<SiteStatus>;

export type SiteStatusDetailsScopeDTO = SiteStatusDetailsScope;
export type SiteStatusDetailsQueryDTO = SiteStatusDetailsQuery;

export type SiteDiffKindDTO = SiteDiffKind;

export type SiteStatusBlockDetailsDTO = SiteStatusBlockDetails;
export type SiteStatusPageDetailsDTO = SiteStatusPageDetails;
export type SiteStatusDetailsDTO = SiteStatusDetails;
