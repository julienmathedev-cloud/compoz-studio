/**
 * @file packages/infra/src/site/prisma-site-repository.ts
 * @layer infra/site
 * @description Prisma-backed SiteRepository implementation.
 * @remarks
 * Persistent settings are stored in PostgreSQL; SiteIndex is computed from Page rows ordered by `Page.position`.
 */

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
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
}>;

function toPrismaContentState(state: ContentState): PrismaContentState {
  return state === CONTENT_STATE.PUBLISHED ? "published" : "draft";
}

export class PrismaSiteRepository implements SiteRepository {
  private readonly websiteId: string;

  constructor(opts: PrismaSiteRepositoryOptions) {
    this.websiteId = requireWebsiteId(
      opts.websiteId,
      "PrismaSiteRepository.constructor",
    );
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

  async readIndex(state: ContentState): Promise<SiteIndex> {
    const prismaState = toPrismaContentState(state);

    const pages = await prisma.page.findMany({
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
    });

    return toDomainSiteIndex(pages, state);
  }

  async putIndex(
    state: ContentState,
    index: Readonly<SiteIndex>,
  ): Promise<void> {
    await this.ensureBase();

    const prismaState = toPrismaContentState(state);

    await prisma.$transaction(
      index.pages.map((page, position) =>
        prisma.page.updateMany({
          where: {
            websiteId: this.websiteId,
            state: prismaState,
            pageId: page.id,
          },
          data: {
            position,
          },
        }),
      ),
    );
  }

  async readSettings(state: ContentState): Promise<SiteSettings> {
    const prismaState = toPrismaContentState(state);

    const row = await prisma.siteSettings.findUnique({
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

    await prisma.siteSettings.upsert({
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
