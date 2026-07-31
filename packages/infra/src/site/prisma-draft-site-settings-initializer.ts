/**
 * @file packages/infra/src/site/prisma-draft-site-settings-initializer.ts
 * @layer infra/site
 * @description Prisma provisioning adapter for initializing a Website's Draft settings.
 */

import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { DraftSiteSettingsInitializer } from "@compoz/core/domain/site/ports/draft-site-settings-initializer";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import type { PrismaClient } from "@compoz/infra/prisma/generated";
import { prisma } from "@compoz/infra/prisma/prisma-client";
import {
  toPrismaSiteSettingsCreateData,
  toPrismaSiteSettingsUpdateData,
} from "@compoz/infra/site/mappers/site-settings.mapper";
import { PrismaSiteRepository } from "@compoz/infra/site/prisma-site-repository";

export class PrismaDraftSiteSettingsInitializer
  implements DraftSiteSettingsInitializer
{
  private readonly websiteId: string;
  private readonly client: PrismaClient;

  constructor(options: Readonly<{ websiteId: string; client?: PrismaClient }>) {
    this.websiteId = requireWebsiteId(
      options.websiteId,
      "PrismaDraftSiteSettingsInitializer.constructor",
    );
    this.client = options.client ?? prisma;
  }

  async initializeDraftSettings(settings: Readonly<SiteSettings>): Promise<void> {
    await new PrismaSiteRepository({
      websiteId: this.websiteId,
      client: this.client,
    }).ensureBase();

    await this.client.siteSettings.upsert({
      where: {
        websiteId_state: { websiteId: this.websiteId, state: "draft" },
      },
      create: toPrismaSiteSettingsCreateData(this.websiteId, "draft", settings),
      update: toPrismaSiteSettingsUpdateData(settings),
    });
  }
}
