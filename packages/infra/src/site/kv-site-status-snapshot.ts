/**
 * @file packages/infra/src/site/kv-site-status-snapshot.ts
 * @layer infra/site
 *
 * @description
 * Implémentation KV du port SiteStatusCachePort.
 *
 * Stratégie (versionnée) :
 * - status snapshot : 1 clé fixe
 * - statusDetails snapshots : clés paramétrées + version (cache busting)
 * - invalidation statusDetails : 1 op (INCR version) => plus de SCAN/SET/pipeline
 *
 * Notes V0.5 :
 * - TTL sur les snapshots "details" pour éviter l’accumulation de clés après bump de version.
 */

import type { SiteStatus } from "@compoz/core/domain/site/entities/site-status";
import type {
  SiteStatusDetails,
  SiteStatusDetailsQuery,
} from "@compoz/core/domain/site/entities/site-status-details";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";

import { getUpstashRedis, parseRedisJson } from "@compoz/infra/kv/kv-redis";
import { kvCmd } from "@compoz/infra/kv/kv-telemetry";
import { normalizeTenantId } from "@compoz/infra/lib/normalize-tenant-id";

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

type KvSiteStatusSnapshotOptions = {
  /** Tenant cible. Fallback: "default". */
  tenantId?: string;
};

/* -------------------------------------------------------------------------- */
/* Config                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * TTL pour les snapshots "details".
 * Objectif : éviter l’accumulation de clés après invalidations (bump version).
 *
 * 15 minutes est un bon compromis V0.5 :
 * - assez long pour amortir les refresh UI,
 * - assez court pour que les anciennes versions expirent vite.
 */
const STATUS_DETAILS_TTL_SECONDS = 15 * 60;

/* -------------------------------------------------------------------------- */
/* Keys                                                                       */
/* -------------------------------------------------------------------------- */

function statusSnapshotKey(tenant: string): string {
  return `compoz:${tenant}:status:snapshot`;
}

/**
 * Version token pour les snapshots "details".
 * Invalidation = INCR cette clé (1 write).
 */
function statusDetailsVersionKey(tenant: string): string {
  return `compoz:${tenant}:statusDetails:version`;
}

function statusDetailsSnapshotKey(
  tenant: string,
  version: number,
  query: SiteStatusDetailsQuery,
): string {
  const scope = query?.scope === "all" ? "all" : "dirty";
  const include = query?.includeBlocks ? "1" : "0";

  // ✅ token explicite pour éviter l’ambiguïté "all" vs "pageId vide"
  const pageId = (query?.pageId ?? "").trim();
  const pageToken = pageId ? `page:${pageId}` : "page:all";

  return `compoz:${tenant}:statusDetails:snapshot:v${version}:${scope}:${include}:${pageToken}`;
}

function kvCtx(base: string): string {
  return `siteStatusSnapshot.${base}`;
}

/* -------------------------------------------------------------------------- */
/* Impl                                                                        */
/* -------------------------------------------------------------------------- */

export class KvSiteStatusSnapshot implements SiteStatusCachePort {
  private readonly redis = getUpstashRedis();
  private readonly tenantId: string;

  /**
   * Micro-cache process-local pour éviter de GET la version plusieurs fois
   * dans une même requête serveur.
   */
  private detailsVersionMemo: number | null = null;

  constructor(opts: KvSiteStatusSnapshotOptions = {}) {
    this.redis = getUpstashRedis();
    this.tenantId = normalizeTenantId(opts.tenantId);
  }

  private async getDetailsVersion(): Promise<number> {
    if (this.detailsVersionMemo != null) return this.detailsVersionMemo;

    const key = statusDetailsVersionKey(this.tenantId);

    const raw = await kvCmd(kvCtx("details.version.get"), "get", () =>
      this.redis.get(key),
    );

    // Par défaut : version 0
    const v =
      typeof raw === "number" ? raw : Number(String(raw ?? "0").trim() || "0");

    const safe = Number.isFinite(v) && v >= 0 ? v : 0;

    this.detailsVersionMemo = safe;
    return safe;
  }

  private bumpDetailsVersionMemo(next: number) {
    // Après INCR, on synchronise le memo local
    this.detailsVersionMemo = next;
  }

  async readStatusSnapshot(): Promise<SiteStatus | null> {
    const key = statusSnapshotKey(this.tenantId);

    const raw = await kvCmd(kvCtx("status.get"), "get", () =>
      this.redis.get(key),
    );

    return parseRedisJson<SiteStatus>(raw);
  }

  async putStatusSnapshot(status: SiteStatus): Promise<void> {
    const key = statusSnapshotKey(this.tenantId);

    await kvCmd(kvCtx("status.set"), "set", () =>
      this.redis.set(key, JSON.stringify(status)),
    );
  }

  async readStatusDetailsSnapshot(
    query: SiteStatusDetailsQuery,
  ): Promise<SiteStatusDetails | null> {
    const version = await this.getDetailsVersion();
    const key = statusDetailsSnapshotKey(this.tenantId, version, query);

    const raw = await kvCmd(kvCtx("details.get"), "get", () =>
      this.redis.get(key),
    );

    return parseRedisJson<SiteStatusDetails>(raw);
  }

  async putStatusDetailsSnapshot(
    query: SiteStatusDetailsQuery,
    details: SiteStatusDetails,
  ): Promise<void> {
    const version = await this.getDetailsVersion();
    const key = statusDetailsSnapshotKey(this.tenantId, version, query);

    await kvCmd(kvCtx("details.set"), "set", () =>
      this.redis.set(key, JSON.stringify(details), {
        ex: STATUS_DETAILS_TTL_SECONDS,
      }),
    );
  }

  async invalidateStatus(): Promise<void> {
    const key = statusSnapshotKey(this.tenantId);

    await kvCmd(kvCtx("invalidate.status.del"), "del", () =>
      this.redis.del(key),
    );
  }

  /**
   * Invalidation "details" : 1 op (INCR version).
   * - Les anciennes clés deviennent obsolètes automatiquement.
   * - TTL sur les snapshots pour éviter l’accumulation après bump version.
   */
  async invalidateStatusDetails(): Promise<void> {
    const key = statusDetailsVersionKey(this.tenantId);

    const next = await kvCmd(kvCtx("invalidate.details.incr"), "other", () =>
      this.redis.incr(key),
    );

    // Upstash renvoie généralement un number
    const nextNum =
      typeof next === "number" ? next : Number(String(next ?? "0"));

    this.bumpDetailsVersionMemo(
      Number.isFinite(nextNum) && nextNum >= 0 ? nextNum : 0,
    );
  }

  /**
   * Invalidation ciblée : dans la stratégie versionnée, on n’a plus
   * besoin de supprimer une clé précise -> on bump la version.
   */
  async invalidateStatusDetailsSnapshot(
    _query: SiteStatusDetailsQuery,
  ): Promise<void> {
    await this.invalidateStatusDetails();
  }

  async invalidateAll(): Promise<void> {
    await this.invalidateStatus();
    await this.invalidateStatusDetails();
  }
}
