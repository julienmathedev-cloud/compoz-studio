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
  CreateDraftPageInput,
  DetachDraftPageChildrenInput,
  PagesRepository,
  UpdateDraftPageBlocksInput,
  UpdateDraftPageMetadataInput,
  UpdateDraftPageParentInput,
} from "@compoz/core/domain/pages/ports/pages-repository";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import {
  toDomainPage,
  toDomainPageWithRevisions,
  toPrismaDraftPageCreateData,
  type PrismaContentState,
} from "@compoz/infra/pages/mappers/page.mapper";
import {
  Prisma,
  type PrismaClient,
} from "@compoz/infra/prisma/generated";
import { prisma } from "@compoz/infra/prisma/prisma-client";
import { PageSchema } from "@compoz/validation/pages/page";

type PrismaPagesRepositoryOptions = Readonly<{
  websiteId: string;
  client?: PrismaClient | Prisma.TransactionClient;
}>;

type PreparedDraftPage = Readonly<{
  pageId: string;
  slug: string;
  input: CreateDraftPageInput;
}>;

function normalizeValue(value: unknown): string {
  return String(value ?? "").trim();
}

function toPrismaContentState(state: ContentState): PrismaContentState {
  return state === CONTENT_STATE.PUBLISHED ? "published" : "draft";
}

function assertValidDraftPageInput(
  input: CreateDraftPageInput,
  operation: "createDraftPage" | "createDraftPages",
): PreparedDraftPage {
  const pageId = normalizeValue(input?.pageId);

  if (!pageId) {
    throw new Error(
      `PrismaPagesRepository.${operation}: input.pageId is required.`,
    );
  }

  const slug = normalizeValue(input?.slug);

  if (!slug) {
    throw new Error(
      `PrismaPagesRepository.${operation}: input.slug is required.`,
    );
  }

  PageSchema.parse({
    id: pageId,
    parentId: input.parentId,
    slug,
    name: input.name,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    blocks: input.blocks,
    sitemap: input.sitemap,
    paginationEnabled: input.paginationEnabled,
    meta: {
      createdAt: input.metaCreatedAt,
      updatedAt: input.metaUpdatedAt,
    },
  });

  return {
    pageId,
    slug,
    input: {
      ...input,
      pageId,
      slug,
    },
  };
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function toNullableJsonValue(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : toJsonValue(value);
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

  async createDraftPage(input: CreateDraftPageInput): Promise<void> {
    const prepared = assertValidDraftPageInput(input, "createDraftPage");

    await this.ensureBase();

    const maxPosition = await this.client.page.aggregate({
      where: {
        websiteId: this.websiteId,
        state: "draft",
      },
      _max: { position: true },
    });

    const position = (maxPosition._max.position ?? -1) + 1;

    await this.client.page.create({
      data: toPrismaDraftPageCreateData(
        this.websiteId,
        prepared.input,
        position,
      ),
    });
  }

  async createDraftPages(
    inputs: ReadonlyArray<CreateDraftPageInput>,
  ): Promise<void> {
    if (inputs.length === 0) {
      return;
    }

    const prepared = inputs.map((input) =>
      assertValidDraftPageInput(input, "createDraftPages"),
    );
    const slugs = new Set<string>();

    for (const item of prepared) {
      if (slugs.has(item.slug)) {
        throw new Error(
          "PrismaPagesRepository.createDraftPages: duplicate slug in batch.",
        );
      }

      slugs.add(item.slug);
    }

    await this.ensureBase();

    const maxPosition = await this.client.page.aggregate({
      where: {
        websiteId: this.websiteId,
        state: "draft",
      },
      _max: { position: true },
    });
    const firstPosition = (maxPosition._max.position ?? -1) + 1;

    await this.client.page.createMany({
      data: prepared.map((item, index) =>
        toPrismaDraftPageCreateData(
          this.websiteId,
          item.input,
          firstPosition + index,
        ),
      ),
    });
  }

  async updateDraftPageMetadata(
    input: UpdateDraftPageMetadataInput,
  ): Promise<void> {
    const pageId = normalizeValue(input.pageId);
    const slug = normalizeValue(input.slug);

    if (!pageId) {
      throw new Error(
        "PrismaPagesRepository.updateDraftPageMetadata: input.pageId is required.",
      );
    }

    if (!slug) {
      throw new Error(
        "PrismaPagesRepository.updateDraftPageMetadata: input.slug is required.",
      );
    }

    const slugOwner = await this.client.page.findUnique({
      where: {
        websiteId_state_slug: {
          websiteId: this.websiteId,
          state: "draft",
          slug,
        },
      },
      select: { pageId: true },
    });

    if (slugOwner && slugOwner.pageId !== pageId) {
      throw new Error(
        "PrismaPagesRepository.updateDraftPageMetadata: slug already exists.",
      );
    }

    await this.client.page.update({
      where: {
        websiteId_state_pageId: {
          websiteId: this.websiteId,
          state: "draft",
          pageId,
        },
      },
      data: {
        slug,
        name: input.name,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        sitemap: toNullableJsonValue(input.sitemap),
        paginationEnabled: input.paginationEnabled,
        metaRevision: input.metaRevision,
        metaUpdatedAt: new Date(input.metaUpdatedAt),
      },
    });
  }

  async updateDraftPageBlocks(
    input: UpdateDraftPageBlocksInput,
  ): Promise<void> {
    const pageId = normalizeValue(input.pageId);

    if (!pageId) {
      throw new Error(
        "PrismaPagesRepository.updateDraftPageBlocks: input.pageId is required.",
      );
    }

    await this.client.page.update({
      where: {
        websiteId_state_pageId: {
          websiteId: this.websiteId,
          state: "draft",
          pageId,
        },
      },
      data: {
        blocks: toJsonValue(input.blocks),
        blocksRevision: input.blocksRevision,
        metaUpdatedAt: new Date(input.metaUpdatedAt),
      },
    });
  }

  async updateDraftPageParent(
    input: UpdateDraftPageParentInput,
  ): Promise<void> {
    const pageId = normalizeValue(input.pageId);

    if (!pageId) {
      throw new Error(
        "PrismaPagesRepository.updateDraftPageParent: input.pageId is required.",
      );
    }

    await this.client.page.update({
      where: {
        websiteId_state_pageId: {
          websiteId: this.websiteId,
          state: "draft",
          pageId,
        },
      },
      data: {
        parentPageId: input.parentId,
        metaUpdatedAt: new Date(input.metaUpdatedAt),
      },
    });
  }

  async detachDraftPageChildren(
    input: DetachDraftPageChildrenInput,
  ): Promise<number> {
    const parentId = normalizeValue(input.parentId);

    if (!parentId) {
      return 0;
    }

    const result = await this.client.page.updateMany({
      where: {
        websiteId: this.websiteId,
        state: "draft",
        parentPageId: parentId,
      },
      data: {
        parentPageId: null,
        metaUpdatedAt: new Date(input.metaUpdatedAt),
      },
    });

    return result.count;
  }

  async deleteDraftPage(pageId: string): Promise<void> {
    const id = normalizeValue(pageId);

    if (!id) {
      return;
    }

    await this.client.page.deleteMany({
      where: {
        websiteId: this.websiteId,
        state: "draft",
        pageId: id,
      },
    });
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
