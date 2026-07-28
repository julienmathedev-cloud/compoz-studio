/**
 * @file packages/infra/src/pages/mappers/page.mapper.ts
 * @layer infra/pages
 * @description Maps Prisma page rows to domain pages and domain pages back to Prisma write data.
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type {
  Page,
  PageMeta,
  PageWithRevisions,
} from "@compoz/core/domain/pages/entities/page";
import { normalizePersistedPageBlocks } from "@compoz/infra/pages/normalizers/normalize-persisted-page-blocks";
import { Prisma } from "@compoz/infra/prisma/generated";
import { PageSchema, type PageShape } from "@compoz/validation/pages/page";

export type PrismaContentState = "draft" | "published";

export type PrismaPageRow = {
  pageId: string;
  parentPageId: string | null;
  slug: string;
  name: string;
  seoTitle: string | null;
  seoDescription: string | null;
  blocks: unknown;
  sitemap: unknown;
  paginationEnabled: boolean;
  metaRevision: number;
  blocksRevision: number;
  metaCreatedAt: Date;
  metaUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaPageBaseWriteData = {
  parentPageId: string | null;
  slug: string;
  name: string;
  seoTitle: string | null;
  seoDescription: string | null;
  blocks: Prisma.InputJsonValue;
  sitemap: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  paginationEnabled: boolean;
  metaCreatedAt: Date;
  metaUpdatedAt: Date;
};

export type PrismaPageCreateData = PrismaPageBaseWriteData & {
  websiteId: string;
  state: PrismaContentState;
  pageId: string;
  position: number;
};

export type PrismaPageUpdateData = PrismaPageBaseWriteData;

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function toNullableJsonValue(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : toJsonValue(value);
}

function toDomainPageFromShape(p: PageShape): Page {
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
    seoDescription: p.seoDescription,
    blocks,
    meta,
    sitemap: p.sitemap,
    paginationEnabled: p.paginationEnabled,
  };
}

export function toDomainPage(row: PrismaPageRow): Page {
  const parsed = PageSchema.parse({
    id: row.pageId,
    parentId: row.parentPageId,
    slug: row.slug,
    name: row.name,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    blocks: normalizePersistedPageBlocks(row.blocks),
    meta: {
      createdAt: row.metaCreatedAt.toISOString(),
      updatedAt: row.metaUpdatedAt.toISOString(),
    },
    sitemap: row.sitemap,
    paginationEnabled: row.paginationEnabled,
  });

  return toDomainPageFromShape(parsed);
}

export function toDomainPageWithRevisions(
  row: PrismaPageRow,
): PageWithRevisions {
  return {
    page: toDomainPage(row),
    revisions: {
      metaRevision: row.metaRevision,
      blocksRevision: row.blocksRevision,
    },
  };
}

export function toPrismaPageCreateData(
  websiteId: string,
  state: PrismaContentState,
  page: Readonly<Page>,
  position: number,
): PrismaPageCreateData {
  return {
    websiteId,
    state,
    pageId: page.id.trim(),
    position,
    ...toPrismaPageUpdateData(page),
  };
}

export function toPrismaPageUpdateData(
  page: Readonly<Page>,
): PrismaPageUpdateData {
  return {
    parentPageId: page.parentId,
    slug: page.slug.trim(),
    name: page.name,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    blocks: toJsonValue(page.blocks),
    sitemap: toNullableJsonValue(page.sitemap),
    paginationEnabled: page.paginationEnabled,
    metaCreatedAt: new Date(page.meta.createdAt),
    metaUpdatedAt: new Date(page.meta.updatedAt),
  };
}
