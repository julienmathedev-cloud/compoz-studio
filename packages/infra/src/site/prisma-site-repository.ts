/**
 * @file packages/infra/src/site/prisma-site-repository.ts
 * @layer infra/site
 * @description Prisma-backed SiteRepository implementation.
 * @remarks
 * Settings and the published index timestamp are persisted in PostgreSQL; index pages are projected by `Page.position`.
 */

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import type { Prisma, PrismaClient } from "@compoz/infra/prisma/generated";
import { prisma } from "@compoz/infra/prisma/prisma-client";
import { toDomainSiteIndex } from "@compoz/infra/site/mappers/site-index.mapper";
import {
  toDomainSiteSettings,
  toPrismaSiteSettingsCreateData,
  toPrismaSiteSettingsUpdateData,
  type PrismaContentState,
} from "@compoz/infra/site/mappers/site-settings.mapper";

type PrismaSiteRepositoryOptions = Readonly<{
  websiteId: string;
  client?: PrismaClient | Prisma.TransactionClient;
}>;

function toPrismaContentState(state: ContentState): PrismaContentState {
  return state === CONTENT_STATE.PUBLISHED ? "published" : "draft";
}

function parseCanonicalIndexTimestamp(updatedAt: string): Date {
  const normalized = updatedAt.trim();

  const parsed = new Date(normalized);

  if (
    !normalized ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString() !== normalized
  ) {
    throw new TypeError(
      "SiteIndex.updatedAt must be a canonical UTC timestamp produced by Date.toISOString().",
    );
  }

  return parsed;
}

export class PrismaSiteRepository implements SiteRepository {
  private readonly websiteId: string;
  private readonly client: PrismaClient | Prisma.TransactionClient;

  constructor(opts: PrismaSiteRepositoryOptions) {
    this.websiteId = requireWebsiteId(
      opts.websiteId,
      "PrismaSiteRepository.constructor",
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

  async readIndex(state: ContentState): Promise<SiteIndex> {
    const prismaState = toPrismaContentState(state);

    const [pages, website] = await Promise.all([
      this.client.page.findMany({
        where: {
          websiteId: this.websiteId,
          state: prismaState,
        },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          pageId: true,
          slug: true,
          name: true,
          parentPageId: true,
          updatedAt: true,
        },
      }),
      state === CONTENT_STATE.PUBLISHED
        ? this.client.website.findUnique({
            where: { id: this.websiteId },
            select: { lastPublishedAt: true },
          })
        : Promise.resolve(null),
    ]);

    const index = toDomainSiteIndex(pages, state);

    if (state !== CONTENT_STATE.PUBLISHED) return index;

    return {
      ...index,
      updatedAt: website?.lastPublishedAt?.toISOString() ?? "",
    };
  }

  async putIndex(
    state: ContentState,
    index: Readonly<SiteIndex>,
  ): Promise<void> {
    const lastPublishedAt =
      state === CONTENT_STATE.PUBLISHED
        ? parseCanonicalIndexTimestamp(index.updatedAt)
        : null;

    await this.ensureBase();

    const prismaState = toPrismaContentState(state);

    const positionUpdates = index.pages.map((page, position) =>
      this.client.page.updateMany({
        where: {
          websiteId: this.websiteId,
          state: prismaState,
          pageId: page.id,
        },
        data: {
          position,
        },
      }),
    );

    if (lastPublishedAt) {
      const writes = [
        ...positionUpdates,
        this.client.website.update({
          where: { id: this.websiteId },
          data: { lastPublishedAt },
        }),
      ];

      if ("$transaction" in this.client) {
        await this.client.$transaction(writes);
      } else {
        await Promise.all(writes);
      }

      return;
    }

    if ("$transaction" in this.client) {
      await this.client.$transaction(positionUpdates);
    } else {
      await Promise.all(positionUpdates);
    }
  }

  async readSettings(state: ContentState): Promise<SiteSettings> {
    const prismaState = toPrismaContentState(state);

    const row = await this.client.siteSettings.findUnique({
      where: {
        websiteId_state: {
          websiteId: this.websiteId,
          state: prismaState,
        },
      },
    });

    return toDomainSiteSettings(row);
  }

  async putSettings(
    state: ContentState,
    settings: Readonly<SiteSettings>,
  ): Promise<void> {
    await this.ensureBase();

    const prismaState = toPrismaContentState(state);

    await this.client.siteSettings.upsert({
      where: {
        websiteId_state: {
          websiteId: this.websiteId,
          state: prismaState,
        },
      },
      create: toPrismaSiteSettingsCreateData(
        this.websiteId,
        prismaState,
        settings,
      ),
      update: toPrismaSiteSettingsUpdateData(settings),
    });
  }
}
