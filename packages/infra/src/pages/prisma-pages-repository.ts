/**
 * @file packages/infra/src/pages/prisma-pages-repository.ts
 * @layer infra/pages
 * @description Prisma-backed PagesRepository implementation.
 */

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import type {
  Page,
  PageWithRevisions,
} from "@compoz/core/domain/pages/entities/page";
import type {
  CompareAndSetDraftPageBlocksInput,
  PagesRepository,
} from "@compoz/core/domain/pages/ports/pages-repository";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import {
  toDomainPage,
  toDomainPageSitemapMetadata,
  toDomainPageWithRevisions,
  type PrismaContentState,
} from "@compoz/infra/pages/mappers/page.mapper";
import type {
  Prisma,
  PrismaClient,
} from "@compoz/infra/prisma/generated";
import { prisma } from "@compoz/infra/prisma/prisma-client";

type PrismaPagesRepositoryOptions = Readonly<{
  websiteId: string;
  client?: PrismaClient | Prisma.TransactionClient;
}>;

function normalizeValue(value: unknown): string {
  return String(value ?? "").trim();
}

function toPrismaContentState(state: ContentState): PrismaContentState {
  return state === CONTENT_STATE.PUBLISHED ? "published" : "draft";
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export class PrismaPagesRepository implements PagesRepository {
  private readonly websiteId: string;
  private readonly client: PrismaClient | Prisma.TransactionClient;

  constructor(opts: PrismaPagesRepositoryOptions) {
    this.websiteId = requireWebsiteId(
      opts.websiteId,
      "PrismaPagesRepository.constructor",
    );
    this.client = opts.client ?? prisma;
  }

  async ensureBase(): Promise<void> {
    await this.client.website.upsert({
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

    if (!id) {
      return null;
    }

    const row = await this.client.page.findUnique({
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

  async readByIdWithRevisions(
    state: ContentState,
    pageId: string,
  ): Promise<PageWithRevisions | null> {
    const id = normalizeValue(pageId);

    if (!id) {
      return null;
    }

    const row = await this.client.page.findUnique({
      where: {
        websiteId_state_pageId: {
          websiteId: this.websiteId,
          state: toPrismaContentState(state),
          pageId: id,
        },
      },
    });

    return row ? toDomainPageWithRevisions(row) : null;
  }

  async readBySlug(state: ContentState, slug: string): Promise<Page | null> {
    const targetSlug = normalizeValue(slug);

    if (!targetSlug) {
      return null;
    }

    const row = await this.client.page.findUnique({
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

    const rows = await this.client.page.findMany({
      where: {
        websiteId: this.websiteId,
        state: prismaState,
        pageId: { in: nonEmptyIds },
      },
    });

    const rowByPageId = new Map(rows.map((row) => [row.pageId, row]));

    return ids.map((id) => {
      if (!id) {
        return null;
      }

      const row = rowByPageId.get(id);

      return row ? toDomainPage(row) : null;
    });
  }

  async readManySitemapMetadataById(
    state: ContentState,
    pageIds: ReadonlyArray<string>,
  ) {
    const prismaState = toPrismaContentState(state);
    const ids = pageIds.map(normalizeValue);
    const nonEmptyIds = [...new Set(ids.filter(Boolean))];

    if (nonEmptyIds.length === 0) {
      return pageIds.map(() => null);
    }

    const rows = await this.client.page.findMany({
      where: {
        websiteId: this.websiteId,
        state: prismaState,
        pageId: { in: nonEmptyIds },
      },
      select: {
        pageId: true,
        sitemap: true,
        metaUpdatedAt: true,
      },
    });

    const rowByPageId = new Map(rows.map((row) => [row.pageId, row]));

    return ids.map((id) => {
      if (!id) {
        return null;
      }

      const row = rowByPageId.get(id);

      return row ? toDomainPageSitemapMetadata(row) : null;
    });
  }

  async compareAndSetDraftPageBlocks(
    input: CompareAndSetDraftPageBlocksInput,
  ): Promise<boolean> {
    const pageId = normalizeValue(input.pageId);

    if (!pageId) {
      throw new Error(
        "PrismaPagesRepository.compareAndSetDraftPageBlocks: input.pageId is required.",
      );
    }

    const result = await this.client.page.updateMany({
      where: {
        websiteId: this.websiteId,
        state: "draft",
        pageId,
        blocksRevision: input.expectedBlocksRevision,
      },
      data: {
        blocks: toJsonValue(input.blocks),
        blocksRevision: { increment: 1 },
        metaUpdatedAt: new Date(input.metaUpdatedAt),
      },
    });

    return result.count === 1;
  }

  async existsById(state: ContentState, pageId: string): Promise<boolean> {
    const id = normalizeValue(pageId);

    if (!id) {
      return false;
    }

    const row = await this.client.page.findUnique({
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

    if (!targetSlug) {
      return false;
    }

    const row = await this.client.page.findUnique({
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
