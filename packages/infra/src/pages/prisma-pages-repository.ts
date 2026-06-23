/**
 * @file packages/infra/src/pages/prisma-pages-repository.ts
 * @layer infra/pages
 *
 * @description
 * Prisma implementation of the PagesRepository.
 */

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";

import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";

import { PageSchema } from "@compoz/validation/pages/page";

import { normalizeTenantId } from "@compoz/infra/lib/normalize-tenant-id";
import {
  toDomainPage,
  toPrismaPageCreateData,
  toPrismaPageUpdateData,
  type PrismaContentState,
} from "@compoz/infra/pages/mappers/page.mapper";
import { prisma } from "@compoz/infra/prisma/prisma-client";

type PrismaPagesRepositoryOptions = Readonly<{
  tenantId?: string;
}>;

type PreparedPage = Readonly<{
  id: string;
  slug: string;
  page: Page;
}>;

function normalizeValue(value: unknown): string {
  return String(value ?? "").trim();
}

function toPrismaContentState(state: ContentState): PrismaContentState {
  return state === CONTENT_STATE.PUBLISHED ? "published" : "draft";
}

function assertValidPageForPut(page: Page): PreparedPage {
  const id = normalizeValue(page?.id);
  if (!id) {
    throw new Error("PrismaPagesRepository.put: page.id is required.");
  }

  const slug = normalizeValue(page?.slug);
  if (!slug) {
    throw new Error("PrismaPagesRepository.put: page.slug is required.");
  }

  PageSchema.parse(page);

  return { id, slug, page };
}

function preparePagesForPutMany(
  pages: ReadonlyArray<Page>,
): ReadonlyArray<PreparedPage> {
  const prepared: PreparedPage[] = [];

  for (const page of pages) {
    const id = normalizeValue(page?.id);
    if (!id) continue;

    const slug = normalizeValue(page?.slug);
    if (!slug) {
      throw new Error("PrismaPagesRepository.putMany: page.slug is required.");
    }

    PageSchema.parse(page);
    prepared.push({ id, slug, page });
  }

  return prepared;
}

export class PrismaPagesRepository implements PagesRepository {
  private readonly websiteId: string;

  constructor(opts: PrismaPagesRepositoryOptions = {}) {
    this.websiteId = normalizeTenantId(opts.tenantId);
  }

  async ensureBase(): Promise<void> {
    await prisma.website.upsert({
      where: { id: this.websiteId },
      create: {
        id: this.websiteId,
        slug: this.websiteId,
        name: this.websiteId,
        type: "site",
      },
      update: {},
    });
  }

  async readById(state: ContentState, pageId: string): Promise<Page | null> {
    const id = normalizeValue(pageId);
    if (!id) return null;

    const row = await prisma.page.findUnique({
      where: {
        websiteId_state_pageId: {
          websiteId: this.websiteId,
          state: toPrismaContentState(state),
          pageId: id,
        },
      },
    });

    return row ? toDomainPage(row) : null;
  }

  async readBySlug(state: ContentState, slug: string): Promise<Page | null> {
    const targetSlug = normalizeValue(slug);
    if (!targetSlug) return null;

    const row = await prisma.page.findUnique({
      where: {
        websiteId_state_slug: {
          websiteId: this.websiteId,
          state: toPrismaContentState(state),
          slug: targetSlug,
        },
      },
    });

    return row ? toDomainPage(row) : null;
  }

  async readManyById(
    state: ContentState,
    pageIds: ReadonlyArray<string>,
  ): Promise<Array<Page | null>> {
    const prismaState = toPrismaContentState(state);
    const ids = pageIds.map(normalizeValue);
    const nonEmptyIds = [...new Set(ids.filter(Boolean))];

    if (nonEmptyIds.length === 0) {
      return pageIds.map(() => null);
    }

    const rows = await prisma.page.findMany({
      where: {
        websiteId: this.websiteId,
        state: prismaState,
        pageId: { in: nonEmptyIds },
      },
    });

    const rowByPageId = new Map(rows.map((row) => [row.pageId, row]));

    return ids.map((id) => {
      if (!id) return null;

      const row = rowByPageId.get(id);
      return row ? toDomainPage(row) : null;
    });
  }

  async put(state: ContentState, page: Page): Promise<void> {
    const prepared = assertValidPageForPut(page);
    const prismaState = toPrismaContentState(state);

    await this.ensureBase();

    const slugOwner = await prisma.page.findUnique({
      where: {
        websiteId_state_slug: {
          websiteId: this.websiteId,
          state: prismaState,
          slug: prepared.slug,
        },
      },
      select: { pageId: true },
    });

    if (slugOwner && slugOwner.pageId !== prepared.id) {
      throw new Error("PrismaPagesRepository.put: slug already exists.");
    }

    const existing = await prisma.page.findUnique({
      where: {
        websiteId_state_pageId: {
          websiteId: this.websiteId,
          state: prismaState,
          pageId: prepared.id,
        },
      },
      select: { position: true },
    });

    const nextPosition =
      existing?.position ??
      ((
        await prisma.page.aggregate({
          where: {
            websiteId: this.websiteId,
            state: prismaState,
          },
          _max: { position: true },
        })
      )._max.position ?? -1) + 1;

    await prisma.page.upsert({
      where: {
        websiteId_state_pageId: {
          websiteId: this.websiteId,
          state: prismaState,
          pageId: prepared.id,
        },
      },
      create: toPrismaPageCreateData(
        this.websiteId,
        prismaState,
        prepared.page,
        nextPosition,
      ),
      update: toPrismaPageUpdateData(prepared.page),
    });
  }

  async putMany(
    state: ContentState,
    pages: ReadonlyArray<Page>,
  ): Promise<void> {
    await this.ensureBase();
    if (pages.length === 0) return;

    const prepared = preparePagesForPutMany(pages);
    if (prepared.length === 0) return;

    const slugOwnerByBatch = new Map<string, string>();

    for (const item of prepared) {
      const currentOwner = slugOwnerByBatch.get(item.slug);

      if (currentOwner && currentOwner !== item.id) {
        throw new Error(
          "PrismaPagesRepository.putMany: duplicate slug in batch.",
        );
      }

      slugOwnerByBatch.set(item.slug, item.id);
    }

    const prismaState = toPrismaContentState(state);
    const ids = prepared.map((item) => item.id);
    const slugs = prepared.map((item) => item.slug);

    const [existingRows, slugRows, maxPosition] = await Promise.all([
      prisma.page.findMany({
        where: {
          websiteId: this.websiteId,
          state: prismaState,
          pageId: { in: ids },
        },
        select: { pageId: true, position: true },
      }),
      prisma.page.findMany({
        where: {
          websiteId: this.websiteId,
          state: prismaState,
          slug: { in: slugs },
        },
        select: { pageId: true, slug: true },
      }),
      prisma.page.aggregate({
        where: {
          websiteId: this.websiteId,
          state: prismaState,
        },
        _max: { position: true },
      }),
    ]);

    const existingPositionById = new Map(
      existingRows.map((row) => [row.pageId, row.position]),
    );

    const expectedOwnerBySlug = new Map(
      prepared.map((item) => [item.slug, item.id]),
    );

    for (const row of slugRows) {
      const expectedOwner = expectedOwnerBySlug.get(row.slug);

      if (expectedOwner && expectedOwner !== row.pageId) {
        throw new Error("PrismaPagesRepository.putMany: slug already exists.");
      }
    }

    let nextPosition = (maxPosition._max.position ?? -1) + 1;

    await prisma.$transaction(
      prepared.map((item) => {
        const existingPosition = existingPositionById.get(item.id);
        const position =
          existingPosition === undefined ? nextPosition++ : existingPosition;

        return prisma.page.upsert({
          where: {
            websiteId_state_pageId: {
              websiteId: this.websiteId,
              state: prismaState,
              pageId: item.id,
            },
          },
          create: toPrismaPageCreateData(
            this.websiteId,
            prismaState,
            item.page,
            position,
          ),
          update: toPrismaPageUpdateData(item.page),
        });
      }),
    );
  }

  async deleteById(state: ContentState, pageId: string): Promise<void> {
    const id = normalizeValue(pageId);
    if (!id) return;

    await prisma.page.deleteMany({
      where: {
        websiteId: this.websiteId,
        state: toPrismaContentState(state),
        pageId: id,
      },
    });
  }

  async existsById(state: ContentState, pageId: string): Promise<boolean> {
    const id = normalizeValue(pageId);
    if (!id) return false;

    const row = await prisma.page.findUnique({
      where: {
        websiteId_state_pageId: {
          websiteId: this.websiteId,
          state: toPrismaContentState(state),
          pageId: id,
        },
      },
      select: { id: true },
    });

    return Boolean(row);
  }

  async existsBySlug(state: ContentState, slug: string): Promise<boolean> {
    const targetSlug = normalizeValue(slug);
    if (!targetSlug) return false;

    const row = await prisma.page.findUnique({
      where: {
        websiteId_state_slug: {
          websiteId: this.websiteId,
          state: toPrismaContentState(state),
          slug: targetSlug,
        },
      },
      select: { id: true },
    });

    return Boolean(row);
  }
}
