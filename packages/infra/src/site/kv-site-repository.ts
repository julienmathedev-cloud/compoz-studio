/**
 * @file packages/infra/src/site/kv-site-repository.ts
 * @layer infra/site
 *
 * @description
 * Implémentation du SiteRepository basé sur une base KV, Upstash/Vercel KV.
 *
 * @remarks
 * - Stocke le SiteIndex et les SiteSettings par état de contenu.
 * - Le repository est strictement scopé par `websiteId`.
 * - Aucun fallback implicite n’est appliqué.
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
import { getUpstashRedis, parseRedisJson } from "@compoz/infra/kv/kv-redis";
import { kvCmd } from "@compoz/infra/kv/kv-telemetry";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

type KvSiteRepositoryOptions = Readonly<{
  websiteId: string;
}>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function indexKey(websiteId: string, state: ContentState): string {
  return `compoz:${websiteId}:${state}:site:index`;
}

function settingsKey(websiteId: string, state: ContentState): string {
  return `compoz:${websiteId}:${state}:site:settings`;
}

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

type PersistedSeoSettings = Omit<Partial<SeoSettings>, "structuredData"> & {
  structuredData?: SeoSettings["structuredData"] | boolean;
  structuredDataEnabled?: boolean;
};

function normalizeSeoSettings(
  seo: PersistedSeoSettings | null | undefined,
): SeoSettings {
  const legacyEnabled =
    typeof seo?.structuredData === "boolean"
      ? seo.structuredData
      : typeof seo?.structuredDataEnabled === "boolean"
        ? seo.structuredDataEnabled
        : undefined;

  const structuredData =
    seo?.structuredData &&
    typeof seo.structuredData === "object" &&
    !Array.isArray(seo.structuredData)
      ? {
          ...DEFAULT_SEO_SETTINGS.structuredData,
          ...seo.structuredData,
        }
      : {
          ...DEFAULT_SEO_SETTINGS.structuredData,
          enabled: legacyEnabled ?? DEFAULT_SEO_SETTINGS.structuredData.enabled,
        };

  const {
    structuredData: _legacyStructuredData,
    structuredDataEnabled: _legacyStructuredDataEnabled,
    ...current
  } = seo ?? {};

  return {
    ...DEFAULT_SEO_SETTINGS,
    ...current,
    structuredData,
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

function kvCtx(base: string, state: ContentState): string {
  return `site.${base}.${state}`;
}

/* -------------------------------------------------------------------------- */
/* Repository                                                                 */
/* -------------------------------------------------------------------------- */

export class KvSiteRepository implements SiteRepository {
  private readonly redis = getUpstashRedis();
  private readonly websiteId: string;

  constructor(opts: KvSiteRepositoryOptions) {
    this.websiteId = requireWebsiteId(
      opts.websiteId,
      "KvSiteRepository.constructor",
    );
  }

  async ensureBase(): Promise<void> {
    // no-op KV
  }

  async readIndex(state: ContentState): Promise<SiteIndex> {
    const raw = await kvCmd(kvCtx("readIndex.get", state), "get", () =>
      this.redis.get(indexKey(this.websiteId, state)),
    );

    const json = parseRedisJson<SiteIndex>(raw);

    if (!json) {
      return defaultIndex(state);
    }

    return json;
  }

  async putIndex(state: ContentState, index: SiteIndex): Promise<void> {
    await kvCmd(kvCtx("putIndex.set", state), "set", () =>
      this.redis.set(indexKey(this.websiteId, state), JSON.stringify(index)),
    );
  }

  async readSettings(state: ContentState): Promise<SiteSettings> {
    const raw = await kvCmd(kvCtx("readSettings.get", state), "get", () =>
      this.redis.get(settingsKey(this.websiteId, state)),
    );

    const json = parseRedisJson<Partial<SiteSettings>>(raw);

    if (!json) {
      return defaultSettings();
    }

    const defaults = defaultSettings();

    return {
      header: json.header ?? defaults.header,
      footer: json.footer ?? defaults.footer,
      primaryMenu: json.primaryMenu ?? defaults.primaryMenu,
      legalMenu: json.legalMenu ?? defaults.legalMenu,
      identity: json.identity ?? defaults.identity,
      social: json.social ?? defaults.social,
      seo: normalizeSeoSettings(json.seo as PersistedSeoSettings | undefined),
      theme: mergeThemeSettings(json.theme),
    };
  }

  async putSettings(
    state: ContentState,
    settings: SiteSettings,
  ): Promise<void> {
    await kvCmd(kvCtx("putSettings.set", state), "set", () =>
      this.redis.set(
        settingsKey(this.websiteId, state),
        JSON.stringify(settings),
      ),
    );
  }
}
