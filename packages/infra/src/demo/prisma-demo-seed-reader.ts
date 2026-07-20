/**
 * @file packages/infra/src/demo/prisma-demo-seed-reader.ts
 * @layer infra/demo
 * @description Prisma reader that validates whether a demo seed website can be cloned.
 * @remarks
 * The reader only checks the published index; actual content cloning is delegated to the sandbox cloner.
 */

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { DemoSandboxSeedReader } from "@compoz/core/domain/demo/use-cases/create-demo-sandbox-from-seed.types";

import { prisma } from "@compoz/infra/prisma/prisma-client";
import { getSiteRepository } from "@compoz/infra/site";

function hasUsableSeedPages(
  pages: ReadonlyArray<{ id: string | null | undefined }> | undefined,
): boolean {
  if (!Array.isArray(pages) || pages.length === 0) {
    return false;
  }

  return pages.some((page) => String(page?.id ?? "").trim().length > 0);
}

function normalizeWebsiteId(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export class PrismaDemoSeedReader implements DemoSandboxSeedReader {
  async readSeedSnapshot(
    seedWebsiteId: string,
  ): Promise<{ websiteId: string }> {
    const websiteId = normalizeWebsiteId(seedWebsiteId);

    if (!websiteId) {
      throw new Error(
        "PrismaDemoSeedReader.readSeedSnapshot: websiteId is required.",
      );
    }

    const website = await prisma.website.findFirst({
      where: {
        id: websiteId,
        type: "site",
      },
      select: {
        id: true,
      },
    });

    if (!website) {
      throw new Error(
        "PrismaDemoSeedReader.readSeedSnapshot: demo seed website not found.",
      );
    }

    const site = getSiteRepository({ websiteId });
    const index = await site.readIndex(CONTENT_STATE.PUBLISHED);

    if (!hasUsableSeedPages(index.pages)) {
      throw new Error(
        "PrismaDemoSeedReader.readSeedSnapshot: demo seed is empty or invalid.",
      );
    }

    return { websiteId: website.id };
  }
}
