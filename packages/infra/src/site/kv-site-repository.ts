/**
 * @file packages/infra/src/site/kv-site-repository.ts
 * @layer infra/site
 * @description
 * Implémentation du SiteRepository basé sur une base KV (Upstash/Vercel KV).
 *
 * @remarks
 * - Dépendance Redis isolée dans `packages/infra`.
 * - Télémétrie DEV via `kvCmd` (pas de log de keys complètes).
 * - Fallbacks identiques à l’impl FS : index vide, settings = defaults merge.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";

import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

import { kvCmd } from "@compoz/infra/kv/kv-telemetry";
import { Redis } from "@upstash/redis";

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

type KvSiteRepositoryOptions = {
  /** Tenant cible (siteId). Fallback: "default". */
  tenantId?: string;
};

function normalizeTenantId(input: unknown): string {
  const t = String(input ?? "").trim();
  return t.length > 0 ? t : "default";
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

let _redisSingleton: Redis | null = null;

function getUpstashRedis(): Redis {
  if (_redisSingleton) return _redisSingleton;

  const url =
    process.env["KV_REST_API_URL"] ?? process.env["UPSTASH_REDIS_REST_URL"];
  const token =
    process.env["KV_REST_API_TOKEN"] ?? process.env["UPSTASH_REDIS_REST_TOKEN"];

  if (!url || !token) {
    throw new Error(
      "KvSiteRepository: missing Redis env. Expected KV_REST_API_URL/KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN).",
    );
  }

  _redisSingleton = new Redis({ url, token });
  return _redisSingleton;
}

/**
 * Upstash peut renvoyer une string JSON OU directement un objet (auto-deserialization).
 * Contrat : retourne un objet JSON exploitable ou `null`.
 */
function parseRedisJson<T>(raw: unknown): T | null {
  if (raw == null) return null;

  if (typeof raw === "object") {
    return raw as T;
  }

  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return null;
    return JSON.parse(s) as T;
  }

  return JSON.parse(String(raw)) as T;
}

function indexKey(tenant: string, state: ContentState): string {
  return `compoz:${tenant}:${state}:site:index`;
}

function settingsKey(tenant: string, state: ContentState): string {
  return `compoz:${tenant}:${state}:site:settings`;
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
  };
}

/**
 * Context télémétrie KV "stable".
 * Note : on ne loggue pas les keys complètes (pas de PII / pas d’id dans le context).
 */
function kvCtx(base: string, state: ContentState): string {
  return `site.${base}.${state}`;
}

/* -------------------------------------------------------------------------- */
/* Repository                                                                 */
/* -------------------------------------------------------------------------- */

export class KvSiteRepository implements SiteRepository {
  private readonly redis: Redis;
  private readonly tenantId: string;

  constructor(opts: KvSiteRepositoryOptions = {}) {
    this.redis = getUpstashRedis();
    this.tenantId = normalizeTenantId(opts.tenantId);
  }

  async ensureBase(): Promise<void> {
    // no-op (KV)
  }

  async readIndex(state: ContentState): Promise<SiteIndex> {
    const raw = await kvCmd(kvCtx("readIndex.get", state), "get", () =>
      this.redis.get(indexKey(this.tenantId, state)),
    );

    const json = parseRedisJson<SiteIndex>(raw);

    if (!json) {
      // Fallback aligné FS repo :
      // - draft : updatedAt "now" (utile côté admin)
      // - published : updatedAt "" (aucune donnée publiée)
      return state === "draft"
        ? { pages: [], updatedAt: new Date().toISOString() }
        : { pages: [], updatedAt: "" };
    }

    return json;
  }

  async writeIndex(state: ContentState, index: SiteIndex): Promise<void> {
    await kvCmd(kvCtx("writeIndex.set", state), "set", () =>
      this.redis.set(indexKey(this.tenantId, state), JSON.stringify(index)),
    );
  }

  async readSettings(state: ContentState): Promise<SiteSettings> {
    const raw = await kvCmd(kvCtx("readSettings.get", state), "get", () =>
      this.redis.get(settingsKey(this.tenantId, state)),
    );

    const json = parseRedisJson<Partial<SiteSettings>>(raw);

    if (!json) {
      return defaultSettings();
    }

    const d = defaultSettings();

    // Merge "defaults + overrides" (robuste si KV ne contient qu’un sous-ensemble)
    return {
      header: json.header ?? d.header,
      footer: json.footer ?? d.footer,
      primaryMenu: json.primaryMenu ?? d.primaryMenu,
      legalMenu: json.legalMenu ?? d.legalMenu,
      identity: json.identity ?? d.identity,
      social: json.social ?? d.social,
      seo: json.seo ?? d.seo,
    };
  }

  async writeSettings(
    state: ContentState,
    settings: SiteSettings,
  ): Promise<void> {
    await kvCmd(kvCtx("writeSettings.set", state), "set", () =>
      this.redis.set(
        settingsKey(this.tenantId, state),
        JSON.stringify(settings),
      ),
    );
  }
}
