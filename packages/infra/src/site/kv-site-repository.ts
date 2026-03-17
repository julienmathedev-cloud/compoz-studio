/**
 * @file packages/infra/src/site/kv-site-repository.ts
 * @layer infra/site
 * @description
 * Implémentation du SiteRepository basé sur une base KV (Upstash/Vercel KV).
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

import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

import { getUpstashRedis, parseRedisJson } from "@compoz/infra/kv/kv-redis";
import { kvCmd } from "@compoz/infra/kv/kv-telemetry";
import { normalizeTenantId } from "@compoz/infra/lib/normalize-tenant-id";

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

type KvSiteRepositoryOptions = {
  tenantId?: string;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function indexKey(tenant: string, state: ContentState): string {
  return `compoz:${tenant}:${state}:site:index`;
}

function settingsKey(tenant: string, state: ContentState): string {
  return `compoz:${tenant}:${state}:site:settings`;
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
    seo: { ...DEFAULT_SEO_SETTINGS },
    theme: {
      ...DEFAULT_THEME_SETTINGS,
      lightTokens: { ...DEFAULT_THEME_SETTINGS.lightTokens },
      darkTokens: { ...DEFAULT_THEME_SETTINGS.darkTokens },
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
  private readonly tenantId: string;

  constructor(opts: KvSiteRepositoryOptions = {}) {
    this.tenantId = normalizeTenantId(opts.tenantId);
  }

  async ensureBase(): Promise<void> {
    // no-op
  }

  async readIndex(state: ContentState): Promise<SiteIndex> {
    const raw = await kvCmd(kvCtx("readIndex.get", state), "get", () =>
      this.redis.get(indexKey(this.tenantId, state)),
    );

    const json = parseRedisJson<SiteIndex>(raw);

    if (!json) return defaultIndex(state);

    return json;
  }

  async putIndex(state: ContentState, index: SiteIndex): Promise<void> {
    await kvCmd(kvCtx("putIndex.set", state), "set", () =>
      this.redis.set(indexKey(this.tenantId, state), JSON.stringify(index)),
    );
  }

  async readSettings(state: ContentState): Promise<SiteSettings> {
    const raw = await kvCmd(kvCtx("readSettings.get", state), "get", () =>
      this.redis.get(settingsKey(this.tenantId, state)),
    );

    const json = parseRedisJson<Partial<SiteSettings>>(raw);

    if (!json) return defaultSettings();

    const d = defaultSettings();

    return {
      header: json.header ?? d.header,
      footer: json.footer ?? d.footer,
      primaryMenu: json.primaryMenu ?? d.primaryMenu,
      legalMenu: json.legalMenu ?? d.legalMenu,
      identity: json.identity ?? d.identity,
      social: json.social ?? d.social,
      seo: json.seo ?? d.seo,
      theme: json.theme ?? d.theme,
    };
  }

  async putSettings(
    state: ContentState,
    settings: SiteSettings,
  ): Promise<void> {
    await kvCmd(kvCtx("putSettings.set", state), "set", () =>
      this.redis.set(
        settingsKey(this.tenantId, state),
        JSON.stringify(settings),
      ),
    );
  }
}
