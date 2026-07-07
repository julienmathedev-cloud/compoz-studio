/**
 * @file packages/infra/src/site/kv-site-status-snapshot.ts
 * @layer infra/site
 * @description KV-backed SiteStatusCachePort implementation.
 * @remarks
 * Status details snapshots are versioned: invalidation only increments a version key, while old detail snapshots expire through TTL.
 */

import type { SiteStatus } from "@compoz/core/domain/site/entities/site-status";
import type {
  SiteStatusDetails,
  SiteStatusDetailsQuery,
} from "@compoz/core/domain/site/entities/site-status-details";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";
import { getUpstashRedis, parseRedisJson } from "@compoz/infra/kv/kv-redis";
import { kvCmd } from "@compoz/infra/kv/kv-telemetry";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";

type KvSiteStatusSnapshotOptions = Readonly<{
  websiteId: string;
}>;

/** Detail snapshot TTL limits stale version accumulation after invalidation. */
const STATUS_DETAILS_TTL_SECONDS = 15 * 60;

function statusSnapshotKey(websiteId: string): string {
  return `compoz:${websiteId}:status:snapshot`;
}

/** Version token used to invalidate all detail snapshots with a single INCR. */
function statusDetailsVersionKey(websiteId: string): string {
  return `compoz:${websiteId}:statusDetails:version`;
}

function statusDetailsSnapshotKey(
  websiteId: string,
  version: number,
  query: SiteStatusDetailsQuery,
): string {
  const scope = query?.scope === "all" ? "all" : "dirty";
  const include = query?.includeBlocks ? "1" : "0";

  const pageId = (query?.pageId ?? "").trim();
  const pageToken = pageId ? `page:${pageId}` : "page:all";

  return `compoz:${websiteId}:statusDetails:snapshot:v${version}:${scope}:${include}:${pageToken}`;
}

function kvCtx(base: string): string {
  return `siteStatusSnapshot.${base}`;
}

export class KvSiteStatusSnapshot implements SiteStatusCachePort {
  private readonly redis = getUpstashRedis();
  private readonly websiteId: string;

  /** Request-local memo to avoid repeated version reads in one server flow. */
  private detailsVersionMemo: number | null = null;

  constructor(opts: KvSiteStatusSnapshotOptions) {
    this.redis = getUpstashRedis();
    this.websiteId = requireWebsiteId(
      opts.websiteId,
      "KvSiteStatusSnapshot.constructor",
    );
  }

  private async getDetailsVersion(): Promise<number> {
    if (this.detailsVersionMemo != null) {
      return this.detailsVersionMemo;
    }

    const key = statusDetailsVersionKey(this.websiteId);

    const raw = await kvCmd(kvCtx("details.version.get"), "get", () =>
      this.redis.get(key),
    );

    const value =
      typeof raw === "number" ? raw : Number(String(raw ?? "0").trim() || "0");

    const safe = Number.isFinite(value) && value >= 0 ? value : 0;

    this.detailsVersionMemo = safe;

    return safe;
  }

  private bumpDetailsVersionMemo(next: number): void {
    this.detailsVersionMemo = next;
  }

  async readStatusSnapshot(): Promise<SiteStatus | null> {
    const key = statusSnapshotKey(this.websiteId);

    const raw = await kvCmd(kvCtx("status.get"), "get", () =>
      this.redis.get(key),
    );

    return parseRedisJson<SiteStatus>(raw);
  }

  async putStatusSnapshot(status: SiteStatus): Promise<void> {
    const key = statusSnapshotKey(this.websiteId);

    await kvCmd(kvCtx("status.set"), "set", () =>
      this.redis.set(key, JSON.stringify(status)),
    );
  }

  async readStatusDetailsSnapshot(
    query: SiteStatusDetailsQuery,
  ): Promise<SiteStatusDetails | null> {
    const version = await this.getDetailsVersion();
    const key = statusDetailsSnapshotKey(this.websiteId, version, query);

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
    const key = statusDetailsSnapshotKey(this.websiteId, version, query);

    await kvCmd(kvCtx("details.set"), "set", () =>
      this.redis.set(key, JSON.stringify(details), {
        ex: STATUS_DETAILS_TTL_SECONDS,
      }),
    );
  }

  async invalidateStatus(): Promise<void> {
    const key = statusSnapshotKey(this.websiteId);

    await kvCmd(kvCtx("invalidate.status.del"), "del", () =>
      this.redis.del(key),
    );
  }

  /** Invalidates all detail snapshots by bumping the shared version key. */
  async invalidateStatusDetails(): Promise<void> {
    const key = statusDetailsVersionKey(this.websiteId);

    const next = await kvCmd(kvCtx("invalidate.details.incr"), "other", () =>
      this.redis.incr(key),
    );

    const nextNumber =
      typeof next === "number" ? next : Number(String(next ?? "0"));

    this.bumpDetailsVersionMemo(
      Number.isFinite(nextNumber) && nextNumber >= 0 ? nextNumber : 0,
    );
  }

  /** Targeted invalidation intentionally falls back to the version bump strategy. */
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
