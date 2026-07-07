/**
 * @file packages/infra/src/pages/kv-pages-repository.ts
 * @layer infra/pages
 * @description KV-backed PagesRepository implementation using Upstash Redis.
 * @remarks
 * Maintains slug and page-id secondary indexes to avoid KV scans; all keys are scoped by `websiteId`.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { Page, PageMeta } from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import { getUpstashRedis, parseRedisJson } from "@compoz/infra/kv/kv-redis";
import { kvCmd } from "@compoz/infra/kv/kv-telemetry";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import { normalizePageLegacyBlocks } from "@compoz/infra/pages/mappers/page-legacy-normalizer";
import { PageSchema, type PageShape } from "@compoz/validation/pages/page";

const LOG_NS = "compoz:studio:repo:pages" as const;

/** Stable telemetry context without full KV keys, ids, or PII. */
function kvCtx(op: string, state: ContentState): string {
  return `${LOG_NS}.${op}.${state}`;
}

type KvPagesRepositoryOptions = Readonly<{
  websiteId: string;
}>;

function normalizeSlug(slug: unknown): string {
  return String(slug ?? "").trim();
}

function toDomainPage(page: PageShape): Page {
  const meta: PageMeta = {
    createdAt: page.meta.createdAt,
    updatedAt: page.meta.updatedAt,
  };

  const blocks: ReadonlyArray<Block> = page.blocks as ReadonlyArray<Block>;

  return {
    id: page.id,
    parentId: page.parentId,
    slug: page.slug,
    name: page.name,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    blocks,
    meta,
    sitemap: page.sitemap,
    paginationEnabled: page.paginationEnabled,
  };
}

function pageKey(
  websiteId: string,
  state: ContentState,
  pageId: string,
): string {
  return `compoz:${websiteId}:${state}:pages:${pageId}`;
}

function pageSlugIndexKey(
  websiteId: string,
  state: ContentState,
  slug: string,
): string {
  return `compoz:${websiteId}:${state}:pagesBySlug:${slug}`;
}

function pageSlugRefKey(
  websiteId: string,
  state: ContentState,
  pageId: string,
): string {
  return `compoz:${websiteId}:${state}:pageSlugById:${pageId}`;
}

export class KvPagesRepository implements PagesRepository {
  private readonly redis = getUpstashRedis();
  private readonly websiteId: string;

  constructor(opts: KvPagesRepositoryOptions) {
    this.redis = getUpstashRedis();
    this.websiteId = requireWebsiteId(
      opts.websiteId,
      "KvPagesRepository.constructor",
    );
  }

  async ensureBase(): Promise<void> {
    // no-op
  }

  private async readSlugOwnerId(
    state: ContentState,
    slug: string,
  ): Promise<string | null> {
    const target = normalizeSlug(slug);

    if (!target) {
      return null;
    }

    const rawPageId = await kvCmd(kvCtx("slugIndex.get", state), "get", () =>
      this.redis.get(pageSlugIndexKey(this.websiteId, state, target)),
    );

    const pageId = typeof rawPageId === "string" ? rawPageId.trim() : "";

    return pageId || null;
  }

  private async readSlugByPageId(
    state: ContentState,
    pageId: string,
  ): Promise<string | null> {
    const id = String(pageId ?? "").trim();

    if (!id) {
      return null;
    }

    const rawSlug = await kvCmd(kvCtx("slugRef.get", state), "get", () =>
      this.redis.get(pageSlugRefKey(this.websiteId, state, id)),
    );

    const slug = typeof rawSlug === "string" ? rawSlug.trim() : "";

    return slug || null;
  }

  async readById(state: ContentState, pageId: string): Promise<Page | null> {
    const id = String(pageId ?? "").trim();

    if (!id) {
      return null;
    }

    const raw = await kvCmd(kvCtx("readById.get", state), "get", () =>
      this.redis.get(pageKey(this.websiteId, state, id)),
    );

    const json = parseRedisJson<unknown>(raw);

    if (!json) {
      return null;
    }

    const normalized = normalizePageLegacyBlocks(json);
    const parsed = PageSchema.parse(normalized);

    return toDomainPage(parsed);
  }

  async readBySlug(state: ContentState, slug: string): Promise<Page | null> {
    const pageId = await this.readSlugOwnerId(state, slug);

    if (!pageId) {
      return null;
    }

    return this.readById(state, pageId);
  }

  async put(state: ContentState, page: Page): Promise<void> {
    const pageId = String(page?.id ?? "").trim();

    if (!pageId) {
      throw new Error("KvPagesRepository.put: page.id is required.");
    }

    PageSchema.parse(page);

    const nextSlug = normalizeSlug(page.slug);

    if (!nextSlug) {
      throw new Error("KvPagesRepository.put: page.slug is required.");
    }

    const [rawPrevSlug, rawSlugOwnerId] = await kvCmd(
      kvCtx("put.indexes.mget", state),
      "other",
      () =>
        this.redis.mget(
          pageSlugRefKey(this.websiteId, state, pageId),
          pageSlugIndexKey(this.websiteId, state, nextSlug),
        ),
    );

    const prevSlug =
      typeof rawPrevSlug === "string" ? normalizeSlug(rawPrevSlug) : "";

    const slugOwnerId =
      typeof rawSlugOwnerId === "string" ? rawSlugOwnerId.trim() : "";

    if (slugOwnerId && slugOwnerId !== pageId) {
      throw new Error("KvPagesRepository.put: slug already exists.");
    }

    await kvCmd(kvCtx("put.set", state), "set", () =>
      this.redis.set(
        pageKey(this.websiteId, state, pageId),
        JSON.stringify(page),
      ),
    );

    if (prevSlug && prevSlug !== nextSlug) {
      await kvCmd(kvCtx("put.slugIndex.delOld", state), "del", () =>
        this.redis.del(pageSlugIndexKey(this.websiteId, state, prevSlug)),
      );
    }

    await kvCmd(kvCtx("put.slugIndex.set", state), "set", () =>
      this.redis.set(pageSlugIndexKey(this.websiteId, state, nextSlug), pageId),
    );

    await kvCmd(kvCtx("put.slugRef.set", state), "set", () =>
      this.redis.set(pageSlugRefKey(this.websiteId, state, pageId), nextSlug),
    );
  }

  async putMany(
    state: ContentState,
    pages: ReadonlyArray<Page>,
  ): Promise<void> {
    await this.ensureBase();

    if (pages.length === 0) {
      return;
    }

    const record: Record<string, string> = {};
    const nextPages: Array<{ id: string; slug: string; page: Page }> = [];

    for (const page of pages) {
      const id = String(page?.id ?? "").trim();

      if (!id) {
        continue;
      }

      PageSchema.parse(page);

      const slug = normalizeSlug(page.slug);

      if (!slug) {
        throw new Error("KvPagesRepository.putMany: page.slug is required.");
      }

      record[pageKey(this.websiteId, state, id)] = JSON.stringify(page);
      nextPages.push({ id, slug, page });
    }

    if (nextPages.length === 0) {
      return;
    }

    const seenBatchSlugOwner = new Map<string, string>();

    for (const item of nextPages) {
      const currentOwner = seenBatchSlugOwner.get(item.slug);

      if (currentOwner && currentOwner !== item.id) {
        throw new Error("KvPagesRepository.putMany: duplicate slug in batch.");
      }

      seenBatchSlugOwner.set(item.slug, item.id);
    }

    const refKeys = nextPages.map((item) =>
      pageSlugRefKey(this.websiteId, state, item.id),
    );

    const ownerKeys = nextPages.map((item) =>
      pageSlugIndexKey(this.websiteId, state, item.slug),
    );

    const [rawPrevSlugs, rawSlugOwners] = await Promise.all([
      kvCmd(kvCtx("putMany.slugRefs.mget", state), "other", () =>
        this.redis.mget(...refKeys),
      ),
      kvCmd(kvCtx("putMany.slugOwners.mget", state), "other", () =>
        this.redis.mget(...ownerKeys),
      ),
    ]);

    const prevSlugById = new Map<string, string>();

    if (Array.isArray(rawPrevSlugs)) {
      for (let index = 0; index < nextPages.length; index += 1) {
        const rawPrevSlug = rawPrevSlugs[index];
        const prevSlug =
          typeof rawPrevSlug === "string" ? normalizeSlug(rawPrevSlug) : "";

        if (prevSlug) {
          prevSlugById.set(nextPages[index].id, prevSlug);
        }
      }
    }

    if (Array.isArray(rawSlugOwners)) {
      for (let index = 0; index < nextPages.length; index += 1) {
        const item = nextPages[index];
        const rawSlugOwnerId = rawSlugOwners[index];
        const slugOwnerId =
          typeof rawSlugOwnerId === "string" ? rawSlugOwnerId.trim() : "";

        if (slugOwnerId && slugOwnerId !== item.id) {
          const prevSlug = prevSlugById.get(item.id) ?? "";

          if (prevSlug !== item.slug) {
            throw new Error("KvPagesRepository.putMany: slug already exists.");
          }
        }
      }
    }

    await kvCmd(kvCtx("putMany.mset", state), "other", () =>
      this.redis.mset(record),
    );

    const slugRefRecord: Record<string, string> = {};

    for (const item of nextPages) {
      const prevSlug = prevSlugById.get(item.id) ?? "";

      if (prevSlug && prevSlug !== item.slug) {
        await kvCmd(kvCtx("putMany.slugIndex.delOld", state), "del", () =>
          this.redis.del(pageSlugIndexKey(this.websiteId, state, prevSlug)),
        );
      }

      await kvCmd(kvCtx("putMany.slugIndex.set", state), "set", () =>
        this.redis.set(
          pageSlugIndexKey(this.websiteId, state, item.slug),
          item.id,
        ),
      );

      slugRefRecord[pageSlugRefKey(this.websiteId, state, item.id)] = item.slug;
    }

    if (Object.keys(slugRefRecord).length > 0) {
      await kvCmd(kvCtx("putMany.slugRefs.mset", state), "other", () =>
        this.redis.mset(slugRefRecord),
      );
    }
  }

  async deleteById(state: ContentState, pageId: string): Promise<void> {
    const id = String(pageId ?? "").trim();

    if (!id) {
      return;
    }

    const slug = await this.readSlugByPageId(state, id);

    if (slug) {
      await kvCmd(kvCtx("deleteById.slugIndex.del", state), "del", () =>
        this.redis.del(pageSlugIndexKey(this.websiteId, state, slug)),
      );
    }

    await kvCmd(kvCtx("deleteById.slugRef.del", state), "del", () =>
      this.redis.del(pageSlugRefKey(this.websiteId, state, id)),
    );

    await kvCmd(kvCtx("deleteById.del", state), "del", () =>
      this.redis.del(pageKey(this.websiteId, state, id)),
    );
  }

  async deleteBySlug(state: ContentState, slug: string): Promise<void> {
    const pageId = await this.readSlugOwnerId(state, slug);

    if (!pageId) {
      return;
    }

    await this.deleteById(state, pageId);
  }

  async existsById(state: ContentState, pageId: string): Promise<boolean> {
    const id = String(pageId ?? "").trim();

    if (!id) {
      return false;
    }

    const count = await kvCmd(kvCtx("existsById.exists", state), "other", () =>
      this.redis.exists(pageKey(this.websiteId, state, id)),
    );

    return count === 1;
  }

  async existsBySlug(state: ContentState, slug: string): Promise<boolean> {
    const pageId = await this.readSlugOwnerId(state, slug);

    return Boolean(pageId);
  }

  async readManyById(
    state: ContentState,
    pageIds: ReadonlyArray<string>,
  ): Promise<Array<Page | null>> {
    const ids = pageIds.map((id) => String(id ?? "").trim()).filter(Boolean);

    if (ids.length === 0) {
      return [];
    }

    const keys = ids.map((id) => pageKey(this.websiteId, state, id));

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
        const normalized = normalizePageLegacyBlocks(json);
        const parsed = PageSchema.parse(normalized);

        out.push(toDomainPage(parsed));
      } catch {
        out.push(null);
      }
    }

    return out;
  }
}
