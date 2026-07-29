/**
 * @file packages/infra/src/pages/prisma-draft-page-structure-initializer.ts
 * @layer infra/pages
 * @description Technical draft-page initializer for a newly-created Website.
 */

import type { DraftPageStructureInitializer } from "@compoz/core/domain/pages/ports/draft-page-structure-initializer";
import type { CreateDraftPageInput } from "@compoz/core/domain/pages/ports/pages-repository";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import { toPrismaDraftPageCreateData } from "@compoz/infra/pages/mappers/page.mapper";
import type { PrismaClient } from "@compoz/infra/prisma/generated";
import { prisma } from "@compoz/infra/prisma/prisma-client";
import { PageSchema } from "@compoz/validation/pages/page";

export class PrismaDraftPageStructureInitializer
  implements DraftPageStructureInitializer
{
  private readonly websiteId: string;
  private readonly client: PrismaClient;

  constructor(options: { websiteId: string; client?: PrismaClient }) {
    this.websiteId = requireWebsiteId(
      options.websiteId,
      "PrismaDraftPageStructureInitializer.constructor",
    );
    this.client = options.client ?? prisma;
  }

  async createDraftPages(
    inputs: ReadonlyArray<CreateDraftPageInput>,
  ): Promise<void> {
    if (inputs.length === 0) return;

    const slugs = new Set<string>();
    for (const input of inputs) {
      PageSchema.parse({
        id: input.pageId,
        parentId: input.parentId,
        slug: input.slug,
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

      if (slugs.has(input.slug)) {
        throw new Error(
          "PrismaDraftPageStructureInitializer.createDraftPages: duplicate slug.",
        );
      }
      slugs.add(input.slug);
    }

    await this.client.page.createMany({
      data: inputs.map((input, position) =>
        toPrismaDraftPageCreateData(this.websiteId, input, position),
      ),
    });
  }
}
