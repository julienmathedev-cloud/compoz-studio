/**
 * @file packages/infra/src/site/kv-site-status-snapshot.ts
 * @layer infra/site
 * @description KV-backed SiteStatusCachePort implementation.
 * @remarks
 * Snapshots are format-versioned and generation-versioned. Redis failures are
 * cache misses/no-ops so persisted repositories remain the source of truth.
 */

import type { SiteStatus } from "@compoz/core/domain/site/entities/site-status";
import type {
  SiteStatusDetails,
  SiteStatusDetailsQuery,
} from "@compoz/core/domain/site/entities/site-status-details";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";
import {
  assertSiteStatus,
  assertSiteStatusDetails,
} from "@compoz/core/domain/site/validators/status";
import { getUpstashRedis, parseRedisJson } from "@compoz/infra/kv/kv-redis";
import { kvCmd } from "@compoz/infra/kv/kv-telemetry";
import { log } from "@compoz/infra/lib/log";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";

type KvSiteStatusSnapshotOptions = Readonly<{
  websiteId: string;
}>;

const SNAPSHOT_FORMAT_VERSION = 1 as const;
const SNAPSHOT_TTL_SECONDS = 15 * 60;
const VERSION_TTL_SECONDS = 30 * 24 * 60 * 60;

type SnapshotEnvelope<T> = Readonly<{
  formatVersion: typeof SNAPSHOT_FORMAT_VERSION;
  value: T;
}>;

const logger = log.child({ ns: "infra:site:statusSnapshot" });

function statusVersionKey(websiteId: string): string {
  return `compoz:${websiteId}:status:version`;
}

function statusSnapshotKey(websiteId: string, version: number): string {
  return `compoz:${websiteId}:status:snapshot:format:v${SNAPSHOT_FORMAT_VERSION}:generation:v${version}`;
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

  return `compoz:${websiteId}:statusDetails:snapshot:format:v${SNAPSHOT_FORMAT_VERSION}:generation:v${version}:${scope}:${include}:${pageToken}`;
}

function kvCtx(base: string): string {
  return `siteStatusSnapshot.${base}`;
}

export class KvSiteStatusSnapshot implements SiteStatusCachePort {
  private readonly websiteId: string;

  /** Request-local memos avoid repeated generation reads in one server flow. */
  private statusVersionMemo: number | null = null;
  private detailsVersionMemo: number | null = null;

  constructor(opts: KvSiteStatusSnapshotOptions) {
    this.websiteId = requireWebsiteId(
      opts.websiteId,
      "KvSiteStatusSnapshot.constructor",
    );
  }

  private warn(operation: string, error: unknown): void {
    logger.warn("siteStatusSnapshot.redis.bestEffortFailure", {
      websiteId: this.websiteId,
      operation,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }

  private parseVersion(raw: unknown): number {
    if (raw == null || String(raw).trim() === "") return 0;

    const value = typeof raw === "number" ? raw : Number(String(raw).trim());

    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error("Invalid site status snapshot generation.");
    }

    return value;
  }

  private async getStatusVersion(): Promise<number> {
    if (this.statusVersionMemo != null) return this.statusVersionMemo;

    const key = statusVersionKey(this.websiteId);
    const raw = await kvCmd(kvCtx("status.version.get"), "get", () =>
      getUpstashRedis().get(key),
    );

    const version = this.parseVersion(raw);
    this.statusVersionMemo = version;
    return version;
  }

  private async getDetailsVersion(): Promise<number> {
    if (this.detailsVersionMemo != null) {
      return this.detailsVersionMemo;
    }

    const key = statusDetailsVersionKey(this.websiteId);

    const raw = await kvCmd(kvCtx("details.version.get"), "get", () =>
      getUpstashRedis().get(key),
    );

    const version = this.parseVersion(raw);
    this.detailsVersionMemo = version;
    return version;
  }

  private bumpDetailsVersionMemo(next: number): void {
    this.detailsVersionMemo = next;
  }

  async readStatusSnapshot(): Promise<SiteStatus | null> {
    try {
      const version = await this.getStatusVersion();
      const key = statusSnapshotKey(this.websiteId, version);
      const raw = await kvCmd(kvCtx("status.get"), "get", () =>
        getUpstashRedis().get(key),
      );
      const envelope = parseRedisJson<SnapshotEnvelope<unknown>>(raw);

      if (envelope?.formatVersion !== SNAPSHOT_FORMAT_VERSION) return null;

      assertSiteStatus(envelope.value);
      return envelope.value;
    } catch (error) {
      this.warn("status.read", error);
      return null;
    }
  }

  async putStatusSnapshot(status: SiteStatus): Promise<void> {
    try {
      assertSiteStatus(status);
      const version = await this.getStatusVersion();
      const key = statusSnapshotKey(this.websiteId, version);
      const envelope: SnapshotEnvelope<SiteStatus> = {
        formatVersion: SNAPSHOT_FORMAT_VERSION,
        value: status,
      };

      await kvCmd(kvCtx("status.set"), "set", () =>
        getUpstashRedis().set(key, JSON.stringify(envelope), {
          ex: SNAPSHOT_TTL_SECONDS,
        }),
      );
    } catch (error) {
      this.warn("status.write", error);
    }
  }

  async readStatusDetailsSnapshot(
    query: SiteStatusDetailsQuery,
  ): Promise<SiteStatusDetails | null> {
    try {
      const version = await this.getDetailsVersion();
      const key = statusDetailsSnapshotKey(this.websiteId, version, query);
      const raw = await kvCmd(kvCtx("details.get"), "get", () =>
        getUpstashRedis().get(key),
      );
      const envelope = parseRedisJson<SnapshotEnvelope<unknown>>(raw);

      if (envelope?.formatVersion !== SNAPSHOT_FORMAT_VERSION) return null;

      assertSiteStatusDetails(envelope.value);

      const expectedScope = query.scope === "all" ? "all" : "dirty";
      const expectedIncludeBlocks = Boolean(query.includeBlocks);
      const expectedPageId = String(query.pageId ?? "").trim();

      if (
        envelope.value.scope !== expectedScope ||
        envelope.value.includeBlocks !== expectedIncludeBlocks ||
        (expectedPageId &&
          envelope.value.pages.some((page) => page.id !== expectedPageId))
      ) {
        return null;
      }

      return envelope.value;
    } catch (error) {
      this.warn("details.read", error);
      return null;
    }
  }

  async putStatusDetailsSnapshot(
    query: SiteStatusDetailsQuery,
    details: SiteStatusDetails,
  ): Promise<void> {
    try {
      assertSiteStatusDetails(details);
      const version = await this.getDetailsVersion();
      const key = statusDetailsSnapshotKey(this.websiteId, version, query);
      const envelope: SnapshotEnvelope<SiteStatusDetails> = {
        formatVersion: SNAPSHOT_FORMAT_VERSION,
        value: details,
      };

      await kvCmd(kvCtx("details.set"), "set", () =>
        getUpstashRedis().set(key, JSON.stringify(envelope), {
          ex: SNAPSHOT_TTL_SECONDS,
        }),
      );
    } catch (error) {
      this.warn("details.write", error);
    }
  }

  async invalidateStatus(): Promise<void> {
    const key = statusVersionKey(this.websiteId);

    try {
      const next = await kvCmd(kvCtx("invalidate.status.incr"), "other", () =>
        getUpstashRedis().incr(key),
      );
      const nextNumber = this.parseVersion(next);
      this.statusVersionMemo = nextNumber;

      await kvCmd(kvCtx("invalidate.status.expire"), "other", () =>
        getUpstashRedis().expire(key, VERSION_TTL_SECONDS),
      );
    } catch (error) {
      this.statusVersionMemo = null;
      this.warn("status.invalidate", error);
    }
  }

  /** Invalidates all detail snapshots by bumping the shared version key. */
  async invalidateStatusDetails(): Promise<void> {
    const key = statusDetailsVersionKey(this.websiteId);

    try {
      const next = await kvCmd(kvCtx("invalidate.details.incr"), "other", () =>
        getUpstashRedis().incr(key),
      );

      this.bumpDetailsVersionMemo(this.parseVersion(next));

      await kvCmd(kvCtx("invalidate.details.expire"), "other", () =>
        getUpstashRedis().expire(key, VERSION_TTL_SECONDS),
      );
    } catch (error) {
      this.detailsVersionMemo = null;
      this.warn("details.invalidate", error);
    }
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
