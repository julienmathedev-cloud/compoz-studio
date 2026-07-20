/**
 * @file packages/infra/src/site/prisma-publish-site-transaction.ts
 * @layer infra/site
 * @description Prisma implementation of the specialized publication transaction.
 * @remarks
 * Published Page rows have no inbound business relation in the current schema,
 * so replacing them completely is safe and resolves every slug permutation.
 */

import type {
  PublishSiteTransaction,
  PublishSiteTransactionContext,
  PublishedSnapshot,
} from "@compoz/core/domain/site/ports/publish-site-transaction";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import { toPrismaPageCreateData } from "@compoz/infra/pages/mappers/page.mapper";
import { PrismaPagesRepository } from "@compoz/infra/pages/prisma-pages-repository";
import { Prisma } from "@compoz/infra/prisma/generated";
import { prisma } from "@compoz/infra/prisma/prisma-client";
import {
  toPrismaSiteSettingsCreateData,
  toPrismaSiteSettingsUpdateData,
} from "@compoz/infra/site/mappers/site-settings.mapper";
import { PrismaSiteRepository } from "@compoz/infra/site/prisma-site-repository";
import { PageSchema } from "@compoz/validation/pages/page";

const MAX_SERIALIZATION_ATTEMPTS = 3;

type PrismaPublishSiteTransactionOptions = Readonly<{
  websiteId: string;
}>;

function parseCanonicalPublishedAt(value: string): Date {
  const normalized = value.trim();
  const parsed = new Date(normalized);

  if (
    !normalized ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString() !== normalized
  ) {
    throw new TypeError(
      "PublishedSnapshot.publishedAt must be a canonical UTC timestamp.",
    );
  }

  return parsed;
}

function isSerializationConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  return "code" in error && error.code === "P2034";
}

export class PrismaPublishSiteTransaction implements PublishSiteTransaction {
  private readonly websiteId: string;

  constructor(opts: PrismaPublishSiteTransactionOptions) {
    this.websiteId = requireWebsiteId(
      opts.websiteId,
      "PrismaPublishSiteTransaction.constructor",
    );
  }

  async run<T>(
    operation: (context: PublishSiteTransactionContext) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; attempt <= MAX_SERIALIZATION_ATTEMPTS; attempt++) {
      try {
        return await prisma.$transaction(
          async (transactionClient) => {
            await transactionClient.website.upsert({
              where: { id: this.websiteId },
              create: {
                id: this.websiteId,
                slug: this.websiteId,
                name: this.websiteId,
                type: "site",
              },
              update: {},
            });

            // Serializes publications for this Website without blocking others.
            await transactionClient.$queryRaw(
              Prisma.sql`SELECT "id" FROM "Website" WHERE "id" = ${this.websiteId} FOR UPDATE`,
            );

            const site = new PrismaSiteRepository({
              websiteId: this.websiteId,
              client: transactionClient,
            });
            const pages = new PrismaPagesRepository({
              websiteId: this.websiteId,
              client: transactionClient,
            });

            const replacePublishedSnapshot = async (
              snapshot: PublishedSnapshot,
            ): Promise<void> => {
              const publishedAt = parseCanonicalPublishedAt(
                snapshot.publishedAt,
              );

              for (const page of snapshot.pages) PageSchema.parse(page);

              // Full replacement makes slug reuse and permutations conflict-free.
              await transactionClient.page.deleteMany({
                where: {
                  websiteId: this.websiteId,
                  state: "published",
                },
              });

              if (snapshot.pages.length > 0) {
                await transactionClient.page.createMany({
                  data: snapshot.pages.map((page, position) =>
                    toPrismaPageCreateData(
                      this.websiteId,
                      "published",
                      page,
                      position,
                    ),
                  ),
                });
              }

              await transactionClient.siteSettings.upsert({
                where: {
                  websiteId_state: {
                    websiteId: this.websiteId,
                    state: "published",
                  },
                },
                create: toPrismaSiteSettingsCreateData(
                  this.websiteId,
                  "published",
                  snapshot.settings,
                ),
                update: toPrismaSiteSettingsUpdateData(snapshot.settings),
              });

              await transactionClient.website.update({
                where: { id: this.websiteId },
                data: { lastPublishedAt: publishedAt },
              });
            };

            return operation({ site, pages, replacePublishedSnapshot });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5_000,
            timeout: 15_000,
          },
        );
      } catch (error) {
        if (
          attempt === MAX_SERIALIZATION_ATTEMPTS ||
          !isSerializationConflict(error)
        ) {
          throw error;
        }
      }
    }

    throw new Error("Unreachable publication transaction state.");
  }
}
