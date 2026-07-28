/**
 * @file packages/core/src/domain/site/ports/site-repository.ts
 * @layer core/domain/site/ports
 * @description Storage-agnostic persistence port for the site aggregate.
 * @remarks
 * The repository owns the page index and site settings for each content state.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type {
  DraftSiteIndexWithRevision,
  SiteIndex,
} from "@compoz/core/domain/site/entities/site-index";
import type {
  SiteSettings,
  SiteSettingsWithRevisions,
} from "@compoz/core/domain/site/entities/site-settings";
import type { FooterSettings } from "@compoz/core/domain/site/entities/footer";
import type { HeaderSettings } from "@compoz/core/domain/site/entities/header";
import type { IdentitySettings } from "@compoz/core/domain/site/entities/identity";
import type { LegalMenuSettings } from "@compoz/core/domain/site/entities/legal-menu";
import type { PrimaryMenuSettings } from "@compoz/core/domain/site/entities/primary-menu";
import type { SeoSettings } from "@compoz/core/domain/site/entities/seo";
import type { SocialSettings } from "@compoz/core/domain/site/entities/social";
import type { ThemeSettings } from "@compoz/core/domain/site/entities/theme";

export type CompareAndSetDraftFooterInput = Readonly<{
  expectedRevision: number;
  footer: Readonly<FooterSettings>;
}>;

export type DraftFooterWithRevision = Readonly<{
  settings: FooterSettings;
  revision: number;
}>;

export type CompareAndSetDraftHeaderInput = Readonly<{ expectedRevision: number; header: Readonly<HeaderSettings> }>;
export type DraftHeaderWithRevision = Readonly<{ settings: HeaderSettings; revision: number }>;
export type CompareAndSetDraftIdentityInput = Readonly<{ expectedRevision: number; identity: Readonly<IdentitySettings> }>;
export type DraftIdentityWithRevision = Readonly<{ settings: IdentitySettings; revision: number }>;
export type CompareAndSetDraftPrimaryMenuInput = Readonly<{ expectedRevision: number; primaryMenu: Readonly<PrimaryMenuSettings> }>;
export type DraftPrimaryMenuWithRevision = Readonly<{ settings: PrimaryMenuSettings; revision: number }>;
export type CompareAndSetDraftLegalMenuInput = Readonly<{ expectedRevision: number; legalMenu: Readonly<LegalMenuSettings> }>;
export type DraftLegalMenuWithRevision = Readonly<{ settings: LegalMenuSettings; revision: number }>;
export type CompareAndSetDraftSocialInput = Readonly<{ expectedRevision: number; social: Readonly<SocialSettings> }>;
export type DraftSocialWithRevision = Readonly<{ settings: SocialSettings; revision: number }>;
export type CompareAndSetDraftSeoInput = Readonly<{ expectedRevision: number; seo: Readonly<SeoSettings> }>;
export type DraftSeoWithRevision = Readonly<{ settings: SeoSettings; revision: number }>;
export type CompareAndSetDraftThemeInput = Readonly<{ expectedRevision: number; theme: Readonly<ThemeSettings> }>;
export type DraftThemeWithRevision = Readonly<{ settings: ThemeSettings; revision: number }>;

/** Persistence contract for the site aggregate. */
export interface SiteRepository {
  /** Idempotently prepares the backing storage. */
  ensureBase(): Promise<void>;

  /** Reads the page index for a content state. */
  readIndex(state: ContentState): Promise<Readonly<SiteIndex>>;

  /** Reads the draft page index with its Website-level technical revision. */
  readDraftIndexWithRevision(): Promise<
    Readonly<DraftSiteIndexWithRevision>
  >;

  /** Persists the page index and its logical write timestamp. */
  putIndex(state: ContentState, index: Readonly<SiteIndex>): Promise<void>;

  readSettings(state: ContentState): Promise<Readonly<SiteSettings>>;

  readSettingsWithRevisions(
    state: ContentState,
  ): Promise<Readonly<SiteSettingsWithRevisions>>;

  compareAndSetDraftFooter(
    input: CompareAndSetDraftFooterInput,
  ): Promise<DraftFooterWithRevision | null>;

  compareAndSetDraftHeader(input: CompareAndSetDraftHeaderInput): Promise<DraftHeaderWithRevision | null>;
  compareAndSetDraftIdentity(input: CompareAndSetDraftIdentityInput): Promise<DraftIdentityWithRevision | null>;
  compareAndSetDraftPrimaryMenu(input: CompareAndSetDraftPrimaryMenuInput): Promise<DraftPrimaryMenuWithRevision | null>;
  compareAndSetDraftLegalMenu(input: CompareAndSetDraftLegalMenuInput): Promise<DraftLegalMenuWithRevision | null>;
  compareAndSetDraftSocial(input: CompareAndSetDraftSocialInput): Promise<DraftSocialWithRevision | null>;
  compareAndSetDraftSeo(input: CompareAndSetDraftSeoInput): Promise<DraftSeoWithRevision | null>;
  compareAndSetDraftTheme(input: CompareAndSetDraftThemeInput): Promise<DraftThemeWithRevision | null>;

  putSettings(
    state: ContentState,
    settings: Readonly<SiteSettings>,
  ): Promise<void>;
}
