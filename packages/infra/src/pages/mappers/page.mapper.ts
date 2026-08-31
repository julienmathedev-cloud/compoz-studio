/**
 * @file packages/infra/src/pages/mappers/page.mapper.ts
 * @layer infra/pages
 * @description Maps Prisma page rows to domain pages and domain pages back to Prisma write data.
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type {
  Page,
  PageMeta,
  PageSitemap,
  PageWithRevisions,
} from "@compoz/core/domain/pages/entities/page";
import type {
  CreateDraftPageInput,
  PageSitemapMetadata,
} from "@compoz/core/domain/pages/ports/pages-repository";
import { Prisma } from "@compoz/infra/prisma/generated";
import {
  PageSchema,
  PageSitemapSchema,
  type PageShape,
} from "@compoz/validation/pages/page";

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

export type PrismaPageSitemapMetadataRow = {
  pageId: string;
  sitemap: unknown;
  metaUpdatedAt: Date;
};

type PrismaPageCreateContentData = {
  parentPageId: string | null;
  slug: string;
  name: string;
  seoTitle: string | null;
  seoDescription: string | null;
  blocks: Prisma.InputJsonValue;
  sitemap: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  paginationEnabled: boolean;
  metaRevision: number;
  blocksRevision: number;
  metaCreatedAt: Date;
  metaUpdatedAt: Date;
};

export type PrismaPageCreateData = PrismaPageCreateContentData & {
  websiteId: string;
  state: PrismaContentState;
  pageId: string;
  position: number;
};

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
    blocks: row.blocks,
    meta: {
      createdAt: row.metaCreatedAt.toISOString(),
      updatedAt: row.metaUpdatedAt.toISOString(),
    },
    sitemap: row.sitemap,
    paginationEnabled: row.paginationEnabled,
  });

  return toDomainPageFromShape(parsed);
}

export function toDomainPageSitemapMetadata(
  row: PrismaPageSitemapMetadataRow,
): PageSitemapMetadata {
  const sitemap: PageSitemap | null = PageSitemapSchema.nullable().parse(
    row.sitemap,
  );

  return {
    id: row.pageId,
    sitemap,
    metaUpdatedAt: row.metaUpdatedAt.toISOString(),
  };
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

export function toPrismaDraftPageCreateData(
  websiteId: string,
  input: CreateDraftPageInput,
  position: number,
): PrismaPageCreateData {
  return {
    websiteId,
    state: "draft",
    pageId: input.pageId.trim(),
    position,
    parentPageId: input.parentId,
    slug: input.slug.trim(),
    name: input.name,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    blocks: toJsonValue(input.blocks),
    sitemap: toNullableJsonValue(input.sitemap),
    paginationEnabled: input.paginationEnabled,
    metaRevision: 0,
    blocksRevision: 0,
    metaCreatedAt: new Date(input.metaCreatedAt),
    metaUpdatedAt: new Date(input.metaUpdatedAt),
  };
}

export function toPrismaPublishedPageCreateData(
  websiteId: string,
  page: Readonly<Page>,
  position: number,
): PrismaPageCreateData {
  return {
    websiteId,
    state: "published",
    pageId: page.id.trim(),
    position,
    parentPageId: page.parentId,
    slug: page.slug.trim(),
    name: page.name,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    blocks: toJsonValue(page.blocks),
    sitemap: toNullableJsonValue(page.sitemap),
    paginationEnabled: page.paginationEnabled,
    metaRevision: 0,
    blocksRevision: 0,
    metaCreatedAt: new Date(page.meta.createdAt),
    metaUpdatedAt: new Date(page.meta.updatedAt),
  };
}
