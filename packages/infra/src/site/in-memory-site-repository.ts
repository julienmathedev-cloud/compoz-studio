/**
 * @file packages/infra/src/site/in-memory-site-repository.ts
 * @layer infra/site
 * @description In-memory SiteRepository implementation for tests.
 * @remarks
 * Website isolation is handled by the factory, which creates and caches one repository per `websiteId`.
 */

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";
import { DEFAULT_THEME_SETTINGS } from "@compoz/core/domain/site/defaults/theme";
import type { SeoSettings } from "@compoz/core/domain/site/entities/seo";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

/** Returns the empty fallback index for the requested content state. */
function defaultIndex(state: ContentState): SiteIndex {
  return state === CONTENT_STATE.DRAFT
    ? { pages: [], updatedAt: new Date().toISOString() }
    : { pages: [], updatedAt: "" };
}

function defaultSettings(): SiteSettings {
  return {
    header: { ...DEFAULT_HEADER_SETTINGS },
    footer: { ...DEFAULT_FOOTER_SETTINGS },
    primaryMenu: { ...DEFAULT_PRIMARY_MENU_SETTINGS },
    legalMenu: { ...DEFAULT_LEGAL_MENU_SETTINGS },
    identity: { ...DEFAULT_IDENTITY_SETTINGS },
    social: { ...DEFAULT_SOCIAL_SETTINGS },
    seo: {
      ...DEFAULT_SEO_SETTINGS,
      structuredData: { ...DEFAULT_SEO_SETTINGS.structuredData },
    },
    theme: {
      ...DEFAULT_THEME_SETTINGS,
      lightTokens: { ...DEFAULT_THEME_SETTINGS.lightTokens },
      darkTokens: { ...DEFAULT_THEME_SETTINGS.darkTokens },
    },
  };
}

function normalizeSeoSettings(
  seo: Partial<SeoSettings> | null | undefined,
): SeoSettings {
  return {
    ...DEFAULT_SEO_SETTINGS,
    ...seo,
    structuredData: {
      ...DEFAULT_SEO_SETTINGS.structuredData,
      ...seo?.structuredData,
    },
  };
}

function mergeThemeSettings(
  theme: Partial<SiteSettings["theme"]> | null | undefined,
): SiteSettings["theme"] {
  return {
    ...DEFAULT_THEME_SETTINGS,
    ...theme,
    headingFont: theme?.headingFont ?? null,
    lightTokens: {
      ...DEFAULT_THEME_SETTINGS.lightTokens,
      ...theme?.lightTokens,
    },
    darkTokens: {
      ...DEFAULT_THEME_SETTINGS.darkTokens,
      ...theme?.darkTokens,
    },
  };
}

export class InMemorySiteRepository implements SiteRepository {
  private indexDraft: SiteIndex | null = null;
  private indexPublished: SiteIndex | null = null;
  private settingsDraft: SiteSettings | null = null;
  private settingsPublished: SiteSettings | null = null;

  async ensureBase(): Promise<void> {}

  private pickIndex(state: ContentState): SiteIndex | null {
    return state === CONTENT_STATE.PUBLISHED
      ? this.indexPublished
      : this.indexDraft;
  }

  private setIndex(state: ContentState, idx: SiteIndex): void {
    if (state === CONTENT_STATE.PUBLISHED) {
      this.indexPublished = idx;
    } else {
      this.indexDraft = idx;
    }
  }

  private pickSettings(state: ContentState): SiteSettings | null {
    return state === CONTENT_STATE.PUBLISHED
      ? this.settingsPublished
      : this.settingsDraft;
  }

  private setSettings(state: ContentState, settings: SiteSettings): void {
    if (state === CONTENT_STATE.PUBLISHED) {
      this.settingsPublished = settings;
    } else {
      this.settingsDraft = settings;
    }
  }

  async readIndex(state: ContentState): Promise<SiteIndex> {
    return structuredClone(this.pickIndex(state) ?? defaultIndex(state));
  }

  async putIndex(state: ContentState, index: SiteIndex): Promise<void> {
    this.setIndex(state, structuredClone(index));
  }

  /** Returns cloned settings with nested SEO and theme defaults normalized. */
  async readSettings(state: ContentState): Promise<SiteSettings> {
    const settings = this.pickSettings(state) ?? defaultSettings();

    return structuredClone({
      ...settings,
      seo: normalizeSeoSettings(settings.seo),
      theme: mergeThemeSettings(settings.theme),
    });
  }

  async putSettings(
    state: ContentState,
    settings: SiteSettings,
  ): Promise<void> {
    this.setSettings(state, structuredClone(settings));
  }
}
