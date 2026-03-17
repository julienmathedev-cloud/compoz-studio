/**
 * @file packages/core/src/domain/site/dto.ts
 * @layer core/domain
 * @description
 * DTOs exposés pour les réglages du site.
 * Servent de contrat de sortie/entrée pour les adapters (API, infra, public).
 *
 * @remarks
 * - Pour l’instant, ces DTOs sont volontairement très proches des entités domaine
 *   (simplement `Readonly`) afin de limiter la friction aux frontières.
 * - Ils pourront diverger à terme (formats, champs optionnels, optimisations API)
 *   sans impacter le cœur métier.
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
  SiteIndex,
  SiteStatus,
  SocialItem,
  SocialSettings,
  ThemeSettings,
} from "@compoz/core/domain/site/entities";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
// Garde si le use-case publish existe déjà, sinon retire l'import/DTO :
import type {
  SiteDiffKind,
  SiteStatusBlockDetails,
  SiteStatusDetails,
  SiteStatusDetailsQuery,
  SiteStatusDetailsScope,
  SiteStatusPageDetails,
} from "@compoz/core/domain/site/entities/site-status-details";
import type { PublishSiteResult } from "@compoz/core/domain/site/use-cases/publish/publish-site.types";

/** DTO en lecture pour l’index du site (ordre des pages). */
export type SiteIndexDTO = Readonly<SiteIndex>;

/** DTO en lecture pour les réglages du header. */
export type HeaderSettingsDTO = Readonly<HeaderSettings>;
/** DTO en lecture pour les réglages du footer. */
export type FooterSettingsDTO = Readonly<FooterSettings>;
/** DTO en lecture pour les réglages du menu principal. */
export type PrimaryMenuSettingsDTO = Readonly<PrimaryMenuSettings>;
/** DTO en lecture pour un item de menu principal. */
export type PrimaryMenuItemDTO = Readonly<PrimaryMenuItem>;
/** DTO en lecture pour les réglages du menu légal. */
export type LegalMenuSettingsDTO = Readonly<LegalMenuSettings>;
/** DTO en lecture pour un item du menu légal. */
export type LegalMenuItemDTO = Readonly<LegalMenuItem>;
/** DTO en lecture pour les réglages des liens sociaux. */
export type SocialSettingsDTO = Readonly<SocialSettings>;
/** DTO en lecture pour un lien social. */
export type SocialItemDTO = Readonly<SocialItem>;
/** DTO en lecture pour l’identité du site. */
export type IdentitySettingsDTO = Readonly<IdentitySettings>;
/** DTO en lecture pour la configuration SEO globale. */
export type SeoSettingsDTO = Readonly<SeoSettings>;
/** DTO en lecture pour la configuration du thème public. */
export type ThemeSettingsDTO = Readonly<ThemeSettings>;

/**
 * DTO de sortie du use-case `publishSite`.
 * Optionnel : à conserver uniquement si le use-case est présent/actif.
 */
export type PublishSiteResultDTO = Readonly<PublishSiteResult>;

/**
 * DTO de lecture complet regroupant tous les réglages du site.
 * Utilisé typiquement par les adapters HTTP pour exposer l’état global.
 */
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

/**
 * DTO d’écriture pour les réglages du site.
 * Pour l’instant, il est strictement aligné sur l’entité `SiteSettings`.
 * Si les besoins API évoluent (partial, patch, etc.), ce type pourra diverger.
 */
export type WriteSiteSettingsDTO = Readonly<SiteSettings>;

export type SiteStatusDTO = Readonly<SiteStatus>;

/* -------------------------------------------------------------------------------------------------
 * Lazy-load details (Overview table)
 * ------------------------------------------------------------------------------------------------- */

export type SiteStatusDetailsScopeDTO = SiteStatusDetailsScope;
export type SiteStatusDetailsQueryDTO = SiteStatusDetailsQuery;

export type SiteDiffKindDTO = SiteDiffKind;

export type SiteStatusBlockDetailsDTO = SiteStatusBlockDetails;
export type SiteStatusPageDetailsDTO = SiteStatusPageDetails;
export type SiteStatusDetailsDTO = SiteStatusDetails;
