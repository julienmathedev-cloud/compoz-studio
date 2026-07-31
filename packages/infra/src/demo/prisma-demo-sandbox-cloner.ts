/**
 * @file packages/infra/src/demo/prisma-demo-sandbox-cloner.ts
 * @layer infra/demo
 * @description Prisma implementation for cloning a published seed website into a draft sandbox website.
 */

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type {
  DemoSandboxCloneResult,
  DemoSandboxCloner,
} from "@compoz/core/domain/demo/use-cases/create-demo-sandbox-from-seed.types";
import type { Page } from "@compoz/core/domain/pages/entities/page";

import {
  getDraftPageStructureInitializer,
  getPagesRepository,
} from "@compoz/infra/pages";
import { prisma } from "@compoz/infra/prisma/prisma-client";
import {
  getDraftSiteSettingsInitializer,
  getSiteRepository,
} from "@compoz/infra/site";

function getPageIdsFromIndex(
  pages: ReadonlyArray<{ id: string | null | undefined }> | undefined,
): string[] {
  if (!Array.isArray(pages) || pages.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const out: string[] = [];

  for (const page of pages) {
    const pageId = String(page?.id ?? "").trim();

    if (!pageId || seen.has(pageId)) {
      continue;
    }

    seen.add(pageId);
    out.push(pageId);
  }

  return out;
}

function assertAllPagesResolved(
  pageIds: ReadonlyArray<string>,
  pages: ReadonlyArray<Page | null>,
): Page[] {
  const out: Page[] = [];

  for (let index = 0; index < pageIds.length; index += 1) {
    const page = pages[index];

    if (!page) {
      throw new Error(
        `PrismaDemoSandboxCloner.cloneSeedToWebsite: missing seed page "${pageIds[index]}".`,
      );
    }

    if (page.id !== pageIds[index]) {
      throw new Error(
        `PrismaDemoSandboxCloner.cloneSeedToWebsite: seed page order mismatch for "${pageIds[index]}".`,
      );
    }

    out.push(page);
  }

  return out;
}

function normalizeWebsiteId(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export class PrismaDemoSandboxCloner implements DemoSandboxCloner {
  async cloneSeedToWebsite(args: {
    sourceWebsiteId: string;
    targetWebsiteId: string;
  }): Promise<DemoSandboxCloneResult> {
    const sourceWebsiteId = normalizeWebsiteId(args.sourceWebsiteId);
    const targetWebsiteId = normalizeWebsiteId(args.targetWebsiteId);

    if (!sourceWebsiteId) {
      throw new Error(
        "PrismaDemoSandboxCloner.cloneSeedToWebsite: sourceWebsiteId is required.",
      );
    }

    if (!targetWebsiteId) {
      throw new Error(
        "PrismaDemoSandboxCloner.cloneSeedToWebsite: targetWebsiteId is required.",
      );
    }

    const sourceWebsite = await prisma.website.findFirst({
      where: {
        id: sourceWebsiteId,
        type: "site",
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!sourceWebsite) {
      throw new Error(
        "PrismaDemoSandboxCloner.cloneSeedToWebsite: source website not found.",
      );
    }

    const sourceSite = getSiteRepository({ websiteId: sourceWebsiteId });
    const sourcePages = getPagesRepository({ websiteId: sourceWebsiteId });

    const [settings, index] = await Promise.all([
      sourceSite.readSettings(CONTENT_STATE.PUBLISHED),
      sourceSite.readIndex(CONTENT_STATE.PUBLISHED),
    ]);

    if (!settings) {
      throw new Error(
        "PrismaDemoSandboxCloner.cloneSeedToWebsite: source settings not found.",
      );
    }

    const pageIds = getPageIdsFromIndex(index.pages);

    const rawPages =
      pageIds.length > 0
        ? await sourcePages.readManyById(CONTENT_STATE.PUBLISHED, pageIds)
        : [];

    const pages = assertAllPagesResolved(pageIds, rawPages);

    try {
      await prisma.website.create({
        data: {
          id: targetWebsiteId,
          slug: targetWebsiteId,
          name: `${sourceWebsite.name} demo`,
          type: "sandbox",
          sourceWebsiteId: sourceWebsite.id,
        },
      });

      const targetSite = getSiteRepository({ websiteId: targetWebsiteId });
      const targetSettings = getDraftSiteSettingsInitializer({
        websiteId: targetWebsiteId,
      });
      const targetStructure = getDraftPageStructureInitializer({
        websiteId: targetWebsiteId,
      });

      await targetSite.ensureBase();

      await targetSettings.initializeDraftSettings(settings);

      if (pages.length > 0) {
        await targetStructure.createDraftPages(
          pages.map((page) => ({
            pageId: page.id,
            parentId: page.parentId,
            slug: page.slug,
            name: page.name,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            blocks: page.blocks,
            sitemap: page.sitemap,
            paginationEnabled: page.paginationEnabled,
            metaCreatedAt: page.meta.createdAt,
            metaUpdatedAt: page.meta.updatedAt,
          })),
        );
      }
    } catch (error) {
      // Roll back the sandbox website when cloning fails, without masking the original error.
      await this.deleteSandboxWebsite(targetWebsiteId).catch(() => undefined);

      throw error;
    }

    return {
      websiteId: targetWebsiteId,
    };
  }

  async deleteSandboxWebsite(websiteId: string): Promise<void> {
    const targetWebsiteId = normalizeWebsiteId(websiteId);

    if (!targetWebsiteId) {
      return;
    }

    // Avoid deleting a sandbox website when media cleanup is not guaranteed yet.
    const mediaAssets = await prisma.mediaAsset.count({
      where: {
        websiteId: targetWebsiteId,
      },
    });

    if (mediaAssets > 0) {
      return;
    }

    await prisma.website.deleteMany({
      where: {
        id: targetWebsiteId,
        type: "sandbox",
      },
    });
  }
}
