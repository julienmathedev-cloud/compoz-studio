/**
 * @file packages/infra/src/pages/kv-pages-repository.ts
 * @layer infra/pages
 * @description
 * Implémentation du PagesRepository basé sur une base KV (Upstash Redis).
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

import type {
  Block,
  LayoutSectionBlock,
} from "@compoz/core/domain/pages/entities/block";
import type { Cell } from "@compoz/core/domain/pages/entities/cell";
import type {
  Page,
  PageMeta,
  PageSummary,
} from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";

import { kvCmd } from "@compoz/infra/kv/kv-telemetry";

// ⛳️ NOTE: idéalement ces schémas vivent dans @compoz/core (boundary validation),
// pour que @compoz/infra ne dépende pas d’un import "app".
import type { PageShape } from "@compoz/validation/pages/page";
import { PageSchema } from "@compoz/validation/pages/page";

import { Redis } from "@upstash/redis";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */
function toDomainPage(p: PageShape): Page {
  const meta: PageMeta = {
    createdAt: p.meta.createdAt,
    updatedAt: p.meta.updatedAt,
  };

  const blocks: ReadonlyArray<Block> = p.blocks.map((b) => {
    const block: LayoutSectionBlock = {
      ...b,
      id: b.id,
      containerMode: b.containerMode ?? "contained",
      cells: b.cells as ReadonlyArray<Cell>,
      title: b.title as LayoutSectionBlock["title"],
    };
    return block;
  });

  return {
    id: p.id,
    parentId: p.parentId,
    slug: p.slug,
    title: p.title,
    blocks,
    meta,
    sitemap: p.sitemap,
    paginationEnabled: p.paginationEnabled,
  };
}

/**
 * Upstash peut renvoyer directement un objet (auto-deserialization),
 * ou une string JSON, selon la config / le contenu.
 *
 * Contrat : retourne un objet JSON exploitable ou `null`.
 */
function parseRedisJson<T>(raw: unknown): T | null {
  if (raw == null) return null;

  // Cas 1: déjà un objet JSON (Upstash a parsé pour nous)
  if (typeof raw === "object") return raw as T;

  // Cas 2: string JSON
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return null;
    return JSON.parse(s) as T;
  }

  // Cas 3: autre primitive (number/boolean) -> tentative via String()
  return JSON.parse(String(raw)) as T;
}

function pickTenantId(): string {
  return String(process.env["COMPOZ_SITE_ID"] ?? "default").trim() || "default";
}

let _redisSingleton: Redis | null = null;

function getUpstashRedis(): Redis {
  if (_redisSingleton) return _redisSingleton;

  const url =
    process.env["KV_REST_API_URL"] ?? process.env["UPSTASH_REDIS_REST_URL"];
  const token =
    process.env["KV_REST_API_TOKEN"] ?? process.env["UPSTASH_REDIS_REST_TOKEN"];

  if (!url || !token) {
    throw new Error(
      "KvPagesRepository: missing Redis env. Expected KV_REST_API_URL/KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN).",
    );
  }

  _redisSingleton = new Redis({ url, token });
  return _redisSingleton;
}

function pageKey(state: ContentState, pageId: string): string {
  const tenant = pickTenantId();
  return `compoz:${tenant}:${state}:pages:${pageId}`;
}

function pageKeyPattern(state: ContentState): string {
  const tenant = pickTenantId();
  return `compoz:${tenant}:${state}:pages:*`;
}

function pageIdFromKey(key: string): string | null {
  // key = compoz:<tenant>:<state>:pages:<pageId>
  const parts = String(key ?? "").split(":");
  const id = parts[parts.length - 1];
  return id ? id.trim() : null;
}

/**
 * Construit un context "stable" pour la télémétrie KV.
 * Note : on ne loggue pas la key complète (pas de PII / pas d’id dans le context).
 */
function kvCtx(base: string, state: ContentState): string {
  return `pages.${base}.${state}`;
}

/* -------------------------------------------------------------------------- */
/* Repository                                                                 */
/* -------------------------------------------------------------------------- */

export class KvPagesRepository implements PagesRepository {
  private readonly redis: Redis;

  constructor() {
    this.redis = getUpstashRedis();
  }

  async ensureBase(): Promise<void> {
    // no-op (KV)
  }

  async readById(state: ContentState, pageId: string): Promise<Page | null> {
    const id = String(pageId ?? "").trim();
    if (!id) return null;

    const raw = await kvCmd(kvCtx("readById.get", state), "get", () =>
      this.redis.get(pageKey(state, id)),
    );

    const json = parseRedisJson<unknown>(raw);
    if (!json) return null;

    const parsed = PageSchema.parse(json);
    return toDomainPage(parsed);
  }

  async readBySlug(state: ContentState, slug: string): Promise<Page | null> {
    // V0.5 : scan best-effort (comme ton FS impl)
    const target = String(slug ?? "").trim();
    if (!target) return null;

    // ⚠️ coûteux : list (KEYS+MGET) + lecture détaillée par ID
    const pages = await this.list(state);
    const match = pages.find((p) => p.slug === target);
    return match ? this.readById(state, match.id) : null;
  }

  async put(state: ContentState, page: Page): Promise<void> {
    const pageId = String(page?.id ?? "").trim();
    if (!pageId) {
      throw new Error("KvPagesRepository.put: page.id is required.");
    }

    // Défense/contract : validation frontière
    PageSchema.parse(page);

    // Stockage en string JSON (ok même si Upstash auto-parse au get)
    await kvCmd(kvCtx("put.set", state), "set", () =>
      this.redis.set(pageKey(state, pageId), JSON.stringify(page)),
    );
  }

  async putMany(
    state: ContentState,
    pages: ReadonlyArray<Page>,
  ): Promise<void> {
    await this.ensureBase();
    if (pages.length === 0) return;

    // Upstash MSET (object form): mset({ key1: val1, key2: val2, ... })
    const record: Record<string, string> = {};

    for (const p of pages) {
      const id = String(p?.id ?? "").trim();
      if (!id) continue;

      PageSchema.parse(p);
      record[pageKey(state, id)] = JSON.stringify(p);
    }

    if (Object.keys(record).length === 0) return;

    await kvCmd(kvCtx("putMany.mset", state), "other", () =>
      this.redis.mset(record),
    );
  }

  async deleteById(state: ContentState, pageId: string): Promise<void> {
    const id = String(pageId ?? "").trim();
    if (!id) return;

    await kvCmd(kvCtx("deleteById.del", state), "del", () =>
      this.redis.del(pageKey(state, id)),
    );
  }

  async deleteBySlug(state: ContentState, slug: string): Promise<void> {
    const s = String(slug ?? "").trim();
    if (!s) return;

    const found = await this.readBySlug(state, s);
    if (!found) return;

    await this.deleteById(state, found.id);
  }

  async existsById(state: ContentState, pageId: string): Promise<boolean> {
    const id = String(pageId ?? "").trim();
    if (!id) return false;

    const n = await kvCmd(kvCtx("existsById.exists", state), "other", () =>
      this.redis.exists(pageKey(state, id)),
    );

    return n === 1;
  }

  async existsBySlug(state: ContentState, slug: string): Promise<boolean> {
    const s = String(slug ?? "").trim();
    if (!s) return false;

    const p = await this.readBySlug(state, s);
    return Boolean(p?.id);
  }

  async list(state: ContentState): Promise<Array<PageSummary>> {
    const pattern = pageKeyPattern(state);

    // 1) récupérer les keys de pages (V0.5 : KEYS OK, mais O(N))
    const keys = await kvCmd(kvCtx("list.keys", state), "other", () =>
      this.redis.keys(pattern),
    );

    if (!Array.isArray(keys) || keys.length === 0) return [];

    // 2) mget pour limiter les RTT
    const raws = await kvCmd(kvCtx("list.mget", state), "other", () =>
      this.redis.mget(...keys),
    );

    if (!Array.isArray(raws) || raws.length === 0) return [];

    // 3) parse + validate -> PageSummary (si un doc est corrompu, on skip)
    const out: PageSummary[] = [];

    for (let i = 0; i < raws.length; i += 1) {
      const raw = raws[i];
      const json = parseRedisJson<unknown>(raw);
      if (!json) continue;

      try {
        const parsed = PageSchema.parse(json);

        out.push({
          id: parsed.id ?? pageIdFromKey(keys[i]) ?? "",
          slug: parsed.slug,
          title: parsed.title,
          parentId: parsed.parentId ?? null,
        });
      } catch {
        // skip
      }
    }

    return out.filter((p) => Boolean(String(p.id ?? "").trim()));
  }

  async readManyById(
    state: ContentState,
    pageIds: ReadonlyArray<string>,
  ): Promise<Array<Page | null>> {
    const ids = pageIds.map((x) => String(x ?? "").trim()).filter(Boolean);
    if (ids.length === 0) return [];

    const keys = ids.map((id) => pageKey(state, id));

    const raws = await kvCmd(kvCtx("readManyById.mget", state), "other", () =>
      this.redis.mget(...keys),
    );

    if (!Array.isArray(raws) || raws.length === 0) {
      return ids.map(() => null);
    }

    const out: Array<Page | null> = [];

    for (const raw of raws) {
      const json = parseRedisJson<unknown>(raw);
      if (!json) {
        out.push(null);
        continue;
      }

      try {
        const parsed = PageSchema.parse(json);
        out.push(toDomainPage(parsed));
      } catch {
        out.push(null);
      }
    }

    return out;
  }
}
