/**
 * @file packages/infra/src/pages/mappers/page.mapper.ts
 * @layer infra/pages
 *
 * @description
 * Mapper between Prisma Page rows and the domain Page entity.
 */

import { Prisma } from "@prisma/client";

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { Page, PageMeta } from "@compoz/core/domain/pages/entities/page";

import { normalizePageLegacyBlocks } from "@compoz/infra/pages/mappers/page-legacy-normalizer";

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
  const normalized = normalizePageLegacyBlocks({
    id: row.pageId,
    parentId: row.parentPageId,
    slug: row.slug,
    name: row.name,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    blocks: row.blocks,
    meta: {
      createdAt: row.metaCreatedAt.toISOString(),
      updatedAt: row.metaUpdatedAt.toISOString(),
    },
    sitemap: row.sitemap,
    paginationEnabled: row.paginationEnabled,
  });

  const parsed = PageSchema.parse(normalized);
  return toDomainPageFromShape(parsed);
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
