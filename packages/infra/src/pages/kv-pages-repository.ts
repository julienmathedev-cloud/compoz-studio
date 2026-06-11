/**
 * @file packages/infra/src/pages/kv-pages-repository.ts
 * @layer infra/pages
 * @description
 * Implémentation du PagesRepository basé sur une base KV (Upstash Redis).
 *
 * @remarks
 * - Stocke les documents pages par `pageId`.
 * - Maintient un index secondaire `slug -> pageId` pour éviter les scans KV
 *   dans `readBySlug()` / `existsBySlug()`.
 * - Maintient aussi un index secondaire `pageId -> slug` pour éviter
 *   de relire le document complet juste pour retrouver l’ancien slug.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { CONTENT_ICON_KINDS } from "@compoz/core/constants/icons/content-icons";

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { Page, PageMeta } from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";

import { kvCmd } from "@compoz/infra/kv/kv-telemetry";

import { PageSchema, type PageShape } from "@compoz/validation/pages/page";

import { getUpstashRedis, parseRedisJson } from "@compoz/infra/kv/kv-redis";
import { normalizeTenantId } from "@compoz/infra/lib/normalize-tenant-id";

/* -------------------------------------------------------------------------- */
/* Logs / telemetry                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Namespace standard (SoT) :
 * compoz:<surface>:<layer>:<module>
 *
 * Ici : dépôt pages en KV, consommé côté Studio.
 */
const LOG_NS = "compoz:studio:repo:pages" as const;

/**
 * Construit un context "stable" pour la télémétrie KV.
 * Contrat : pas de clé complète (pas de PII / pas d’id dans le context).
 */
function kvCtx(op: string, state: ContentState): string {
  return `${LOG_NS}.${op}.${state}`;
}

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

type KvPagesRepositoryOptions = Readonly<{
  /** Tenant cible. Fallback: "default". */
  tenantId?: string;
}>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const BUTTON_VARIANTS = new Set(["default", "secondary", "outline", "ghost"]);
const BUTTON_ICON_POSITIONS = new Set(["before", "after"]);

type ContentIconKind = (typeof CONTENT_ICON_KINDS)[number];

function normalizeSlug(slug: unknown): string {
  return String(slug ?? "").trim();
}

function isContentIconKind(value: unknown): value is ContentIconKind {
  return (
    typeof value === "string" &&
    CONTENT_ICON_KINDS.includes(value.trim() as ContentIconKind)
  );
}

function normalizeButtonIcon(value: unknown): ContentIconKind | null {
  return isContentIconKind(value) ? (value.trim() as ContentIconKind) : null;
}

function normalizeButtonIconPosition(value: unknown): "before" | "after" {
  const position = typeof value === "string" ? value.trim() : "";

  return BUTTON_ICON_POSITIONS.has(position) && position === "after"
    ? "after"
    : "before";
}

function normalizeButtonVariant(value: unknown): string {
  const variant = typeof value === "string" ? value.trim() : "";

  return BUTTON_VARIANTS.has(variant) ? variant : "default";
}

function normalizeRowReverseOn(value: unknown): {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
} {
  const safe =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<{
          mobile: boolean;
          tablet: boolean;
          desktop: boolean;
        }>)
      : undefined;

  return {
    mobile: Boolean(safe?.mobile),
    tablet: Boolean(safe?.tablet),
    desktop: Boolean(safe?.desktop),
  };
}

function normalizeImageCellLegacy(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const cell = value as Record<string, unknown>;

  if (cell.kind !== "image") {
    return value;
  }

  return {
    ...cell,
    zoomEnabled:
      typeof cell.zoomEnabled === "boolean" ? cell.zoomEnabled : false,
  };
}

function normalizeTimelineCellLegacy(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const cell = value as Record<string, unknown>;

  if (cell.kind !== "timeline") {
    return value;
  }

  return {
    ...cell,
    collapsible:
      typeof cell.collapsible === "boolean" ? cell.collapsible : true,
  };
}

function normalizeButtonPresentationLegacy(
  value: unknown,
  fallbackLabel: string,
): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const button = value as Record<string, unknown>;

  const label =
    typeof button.label === "string" && button.label.trim()
      ? button.label.trim()
      : fallbackLabel;

  return {
    ...button,
    label,
    variant: normalizeButtonVariant(button.variant),
    icon: normalizeButtonIcon(button.icon),
    iconPosition: normalizeButtonIconPosition(button.iconPosition),
  };
}

function normalizeOptionalButtonItemLegacy(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const button = value as Record<string, unknown>;
  const label = typeof button.label === "string" ? button.label.trim() : "";

  if (!label) {
    return null;
  }

  return normalizeButtonPresentationLegacy(button, "");
}

function normalizeButtonsCellLegacy(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const cell = value as Record<string, unknown>;

  if (cell.kind !== "buttons" || !Array.isArray(cell.items)) {
    return value;
  }

  return {
    ...cell,
    items: cell.items.map((item) =>
      normalizeButtonPresentationLegacy(item, ""),
    ),
  };
}

function normalizeStructuredCardItemLegacy(item: unknown): unknown {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return item;
  }

  const structuredCardItem = item as Record<string, unknown>;

  return {
    ...structuredCardItem,
    button: normalizeOptionalButtonItemLegacy(structuredCardItem.button),
  };
}

function normalizeFormCellLegacy(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const cell = value as Record<string, unknown>;

  if (cell.kind !== "form") {
    return value;
  }

  const submitButton =
    cell.submitButton && typeof cell.submitButton === "object"
      ? (cell.submitButton as Record<string, unknown>)
      : undefined;

  const legacySubmitLabel =
    typeof cell.submitLabel === "string" ? cell.submitLabel.trim() : "";

  const legacyVariantButton =
    typeof cell.variantButton === "string" ? cell.variantButton.trim() : "";

  const normalizedSubmitButton = normalizeButtonPresentationLegacy(
    submitButton ?? {
      label: legacySubmitLabel || "Envoyer",
      variant: normalizeButtonVariant(legacyVariantButton),
    },
    legacySubmitLabel || "Envoyer",
  );

  const {
    submitLabel: _submitLabel,
    variantButton: _variantButton,
    submitButton: _legacySubmitButton,
    ...rest
  } = cell;

  return {
    ...rest,
    submitButton: normalizedSubmitButton,
  };
}

function normalizeStructuredCardCellLegacy(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const cell = value as Record<string, unknown>;

  if (cell.kind !== "structuredCard" || !Array.isArray(cell.items)) {
    return value;
  }

  return {
    ...cell,
    items: cell.items.map(normalizeStructuredCardItemLegacy),
  };
}

function normalizeCarouselCellLegacy(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const cell = value as Record<string, unknown>;

  if (cell.kind !== "carousel" || !Array.isArray(cell.items)) {
    return value;
  }

  if (cell.itemKind !== "structuredCard") {
    return value;
  }

  return {
    ...cell,
    items: cell.items.map(normalizeStructuredCardItemLegacy),
  };
}

function normalizeCellLegacy(value: unknown): unknown {
  return normalizeCarouselCellLegacy(
    normalizeStructuredCardCellLegacy(
      normalizeButtonsCellLegacy(
        normalizeFormCellLegacy(
          normalizeTimelineCellLegacy(normalizeImageCellLegacy(value)),
        ),
      ),
    ),
  );
}

function normalizeColumnLegacy(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const column = value as Record<string, unknown>;

  if (!Array.isArray(column.cells)) {
    return value;
  }

  return {
    ...column,
    cells: column.cells.map(normalizeCellLegacy),
  };
}

function normalizePageLegacyBlocks(input: unknown): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return input;
  }

  const page = input as {
    blocks?: unknown;
  };

  if (!Array.isArray(page.blocks)) {
    return input;
  }

  return {
    ...page,
    blocks: page.blocks.map((block) => {
      if (!block || typeof block !== "object" || Array.isArray(block)) {
        return block;
      }

      const safeBlock = block as {
        type?: unknown;
        rows?: unknown;
      };

      if (safeBlock.type !== "section" || !Array.isArray(safeBlock.rows)) {
        return block;
      }

      return {
        ...safeBlock,
        rows: safeBlock.rows.map((row) => {
          if (!row || typeof row !== "object" || Array.isArray(row)) {
            return row;
          }

          const safeRow = row as {
            reverseOn?: unknown;
            columns?: unknown;
          };

          return {
            ...safeRow,
            reverseOn: normalizeRowReverseOn(safeRow.reverseOn),
            columns: Array.isArray(safeRow.columns)
              ? safeRow.columns.map(normalizeColumnLegacy)
              : safeRow.columns,
          };
        }),
      };
    }),
  };
}

function toDomainPage(p: PageShape): Page {
  const meta: PageMeta = {
    createdAt: p.meta.createdAt,
    updatedAt: p.meta.updatedAt,
  };

  const blocks: ReadonlyArray<Block> = p.blocks as ReadonlyArray<Block>;

  return {
    id: p.id,
    parentId: p.parentId,
    slug: p.slug,
    name: p.name,
    seoTitle: p.seoTitle,
    blocks,
    meta,
    sitemap: p.sitemap,
    paginationEnabled: p.paginationEnabled,
  };
}

function pageKey(tenant: string, state: ContentState, pageId: string): string {
  return `compoz:${tenant}:${state}:pages:${pageId}`;
}

function pageSlugIndexKey(
  tenant: string,
  state: ContentState,
  slug: string,
): string {
  return `compoz:${tenant}:${state}:pagesBySlug:${slug}`;
}

function pageSlugRefKey(
  tenant: string,
  state: ContentState,
  pageId: string,
): string {
  return `compoz:${tenant}:${state}:pageSlugById:${pageId}`;
}

/* -------------------------------------------------------------------------- */
/* Repository                                                                 */
/* -------------------------------------------------------------------------- */

export class KvPagesRepository implements PagesRepository {
  private readonly redis = getUpstashRedis();
  private readonly tenantId: string;

  constructor(opts: KvPagesRepositoryOptions = {}) {
    this.redis = getUpstashRedis();
    this.tenantId = normalizeTenantId(opts.tenantId);
  }

  async ensureBase(): Promise<void> {
    // no-op (KV)
  }

  private async readSlugOwnerId(
    state: ContentState,
    slug: string,
  ): Promise<string | null> {
    const target = normalizeSlug(slug);
    if (!target) return null;

    const rawPageId = await kvCmd(kvCtx("slugIndex.get", state), "get", () =>
      this.redis.get(pageSlugIndexKey(this.tenantId, state, target)),
    );

    const pageId = typeof rawPageId === "string" ? rawPageId.trim() : "";
    return pageId || null;
  }

  private async readSlugByPageId(
    state: ContentState,
    pageId: string,
  ): Promise<string | null> {
    const id = String(pageId ?? "").trim();
    if (!id) return null;

    const rawSlug = await kvCmd(kvCtx("slugRef.get", state), "get", () =>
      this.redis.get(pageSlugRefKey(this.tenantId, state, id)),
    );

    const slug = typeof rawSlug === "string" ? rawSlug.trim() : "";
    return slug || null;
  }

  async readById(state: ContentState, pageId: string): Promise<Page | null> {
    const id = String(pageId ?? "").trim();
    if (!id) return null;

    const raw = await kvCmd(kvCtx("readById.get", state), "get", () =>
      this.redis.get(pageKey(this.tenantId, state, id)),
    );

    const json = parseRedisJson<unknown>(raw);
    if (!json) return null;

    const normalized = normalizePageLegacyBlocks(json);
    const parsed = PageSchema.parse(normalized);

    return toDomainPage(parsed);
  }

  async readBySlug(state: ContentState, slug: string): Promise<Page | null> {
    const pageId = await this.readSlugOwnerId(state, slug);
    if (!pageId) return null;

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
          pageSlugRefKey(this.tenantId, state, pageId),
          pageSlugIndexKey(this.tenantId, state, nextSlug),
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
        pageKey(this.tenantId, state, pageId),
        JSON.stringify(page),
      ),
    );

    if (prevSlug && prevSlug !== nextSlug) {
      await kvCmd(kvCtx("put.slugIndex.delOld", state), "del", () =>
        this.redis.del(pageSlugIndexKey(this.tenantId, state, prevSlug)),
      );
    }

    await kvCmd(kvCtx("put.slugIndex.set", state), "set", () =>
      this.redis.set(pageSlugIndexKey(this.tenantId, state, nextSlug), pageId),
    );

    await kvCmd(kvCtx("put.slugRef.set", state), "set", () =>
      this.redis.set(pageSlugRefKey(this.tenantId, state, pageId), nextSlug),
    );
  }

  async putMany(
    state: ContentState,
    pages: ReadonlyArray<Page>,
  ): Promise<void> {
    await this.ensureBase();
    if (pages.length === 0) return;

    const record: Record<string, string> = {};
    const nextPages: Array<{ id: string; slug: string; page: Page }> = [];

    for (const p of pages) {
      const id = String(p?.id ?? "").trim();
      if (!id) continue;

      PageSchema.parse(p);

      const slug = normalizeSlug(p.slug);
      if (!slug) {
        throw new Error("KvPagesRepository.putMany: page.slug is required.");
      }

      record[pageKey(this.tenantId, state, id)] = JSON.stringify(p);
      nextPages.push({ id, slug, page: p });
    }

    if (nextPages.length === 0) return;

    const seenBatchSlugOwner = new Map<string, string>();
    for (const item of nextPages) {
      const currentOwner = seenBatchSlugOwner.get(item.slug);
      if (currentOwner && currentOwner !== item.id) {
        throw new Error("KvPagesRepository.putMany: duplicate slug in batch.");
      }
      seenBatchSlugOwner.set(item.slug, item.id);
    }

    const refKeys = nextPages.map((item) =>
      pageSlugRefKey(this.tenantId, state, item.id),
    );

    const ownerKeys = nextPages.map((item) =>
      pageSlugIndexKey(this.tenantId, state, item.slug),
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
      for (let i = 0; i < nextPages.length; i += 1) {
        const rawPrevSlug = rawPrevSlugs[i];
        const prevSlug =
          typeof rawPrevSlug === "string" ? normalizeSlug(rawPrevSlug) : "";
        if (prevSlug) {
          prevSlugById.set(nextPages[i].id, prevSlug);
        }
      }
    }

    if (Array.isArray(rawSlugOwners)) {
      for (let i = 0; i < nextPages.length; i += 1) {
        const item = nextPages[i];
        const rawSlugOwnerId = rawSlugOwners[i];
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
          this.redis.del(pageSlugIndexKey(this.tenantId, state, prevSlug)),
        );
      }

      await kvCmd(kvCtx("putMany.slugIndex.set", state), "set", () =>
        this.redis.set(
          pageSlugIndexKey(this.tenantId, state, item.slug),
          item.id,
        ),
      );

      slugRefRecord[pageSlugRefKey(this.tenantId, state, item.id)] = item.slug;
    }

    if (Object.keys(slugRefRecord).length > 0) {
      await kvCmd(kvCtx("putMany.slugRefs.mset", state), "other", () =>
        this.redis.mset(slugRefRecord),
      );
    }
  }

  async deleteById(state: ContentState, pageId: string): Promise<void> {
    const id = String(pageId ?? "").trim();
    if (!id) return;

    const slug = await this.readSlugByPageId(state, id);

    if (slug) {
      await kvCmd(kvCtx("deleteById.slugIndex.del", state), "del", () =>
        this.redis.del(pageSlugIndexKey(this.tenantId, state, slug)),
      );
    }

    await kvCmd(kvCtx("deleteById.slugRef.del", state), "del", () =>
      this.redis.del(pageSlugRefKey(this.tenantId, state, id)),
    );

    await kvCmd(kvCtx("deleteById.del", state), "del", () =>
      this.redis.del(pageKey(this.tenantId, state, id)),
    );
  }

  async deleteBySlug(state: ContentState, slug: string): Promise<void> {
    const pageId = await this.readSlugOwnerId(state, slug);
    if (!pageId) return;

    await this.deleteById(state, pageId);
  }

  async existsById(state: ContentState, pageId: string): Promise<boolean> {
    const id = String(pageId ?? "").trim();
    if (!id) return false;

    const n = await kvCmd(kvCtx("existsById.exists", state), "other", () =>
      this.redis.exists(pageKey(this.tenantId, state, id)),
    );

    return n === 1;
  }

  async existsBySlug(state: ContentState, slug: string): Promise<boolean> {
    const pageId = await this.readSlugOwnerId(state, slug);
    return Boolean(pageId);
  }

  async readManyById(
    state: ContentState,
    pageIds: ReadonlyArray<string>,
  ): Promise<Array<Page | null>> {
    const ids = pageIds.map((x) => String(x ?? "").trim()).filter(Boolean);
    if (ids.length === 0) return [];

    const keys = ids.map((id) => pageKey(this.tenantId, state, id));

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
