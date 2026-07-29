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
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { log } from "@compoz/infra/lib/log";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import { toPrismaPublishedPageCreateData } from "@compoz/infra/pages/mappers/page.mapper";
import { PrismaPagesRepository } from "@compoz/infra/pages/prisma-pages-repository";
import { type PrismaClient, Prisma } from "@compoz/infra/prisma/generated";
import { prisma } from "@compoz/infra/prisma/prisma-client";
import {
  toPrismaSiteSettingsCreateData,
  toPrismaSiteSettingsUpdateData,
} from "@compoz/infra/site/mappers/site-settings.mapper";
import { PrismaSiteRepository } from "@compoz/infra/site/prisma-site-repository";
import { PageSchema } from "@compoz/validation/pages/page";

const MAX_SERIALIZATION_ATTEMPTS = 3;
const PUBLISH_RETRY_BASE_DELAY_MS = 25;
const PUBLISH_RETRY_MAX_DELAY_MS = 100;

export type RetryableSerializationConflictKind = "P2034" | "P2010_40001";

export type Sleep = (delayMs: number) => Promise<void>;
export type Jitter = () => number;

type PrismaPublishTransactionRunner = Pick<PrismaClient, "$transaction">;

type PrismaPublishSiteTransactionOptions = Readonly<{
  websiteId: string;
  client?: PrismaPublishTransactionRunner;
  sleep?: Sleep;
  jitter?: Jitter;
}>;

const defaultSleep: Sleep = (delayMs) =>
  new Promise((resolve) => setTimeout(resolve, delayMs));

const defaultJitter: Jitter = Math.random;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function classifyRetryableSerializationConflict(
  error: unknown,
): RetryableSerializationConflictKind | null {
  if (!isRecord(error)) return null;

  if (error.code === "P2034") return "P2034";
  if (error.code !== "P2010") return null;

  const meta = error.meta;
  if (!isRecord(meta)) return null;

  const driverAdapterError = meta.driverAdapterError;
  if (!isRecord(driverAdapterError)) return null;

  const cause = driverAdapterError.cause;
  if (!isRecord(cause)) return null;

  return cause.originalCode === "40001" ? "P2010_40001" : null;
}

function normalizeJitter(value: number): number {
  if (Number.isNaN(value) || value < 0) return 0;
  if (!Number.isFinite(value) || value > 1) return 1;
  return value;
}

export function computePublishRetryDelayMs(params: {
  failedAttempt: number;
  jitter: Jitter;
}): number {
  const baseDelay = Math.min(
    PUBLISH_RETRY_MAX_DELAY_MS,
    PUBLISH_RETRY_BASE_DELAY_MS * 2 ** (params.failedAttempt - 1),
  );
  const normalizedJitter = normalizeJitter(params.jitter());

  return Math.round(
    Math.min(
      PUBLISH_RETRY_MAX_DELAY_MS,
      baseDelay * (1 + normalizedJitter),
    ),
  );
}

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

export class PrismaPublishSiteTransaction implements PublishSiteTransaction {
  private readonly websiteId: string;
  private readonly client: PrismaPublishTransactionRunner;
  private readonly sleep: Sleep;
  private readonly jitter: Jitter;

  constructor(opts: PrismaPublishSiteTransactionOptions) {
    this.websiteId = requireWebsiteId(
      opts.websiteId,
      "PrismaPublishSiteTransaction.constructor",
    );
    this.client = opts.client ?? prisma;
    this.sleep = opts.sleep ?? defaultSleep;
    this.jitter = opts.jitter ?? defaultJitter;
  }

  async run<T>(
    operation: (context: PublishSiteTransactionContext) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; attempt <= MAX_SERIALIZATION_ATTEMPTS; attempt++) {
      try {
        const result = await this.client.$transaction(
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
              transactionClient,
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
                    toPrismaPublishedPageCreateData(
                      this.websiteId,
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

        if (attempt > 1) {
          log.info("site.publish.transaction.retrySucceeded", {
            attempt,
            maxAttempts: MAX_SERIALIZATION_ATTEMPTS,
          });
        }

        return result;
      } catch (error) {
        const conflictKind = classifyRetryableSerializationConflict(error);

        if (!conflictKind) {
          throw error;
        }

        log.warn("site.publish.transaction.retryableConflictDetected", {
          attempt,
          maxAttempts: MAX_SERIALIZATION_ATTEMPTS,
          conflictKind,
        });

        if (attempt === MAX_SERIALIZATION_ATTEMPTS) {
          log.error("site.publish.transaction.retryExhausted", {
            attempt,
            maxAttempts: MAX_SERIALIZATION_ATTEMPTS,
            conflictKind,
          });

          throw new DomainError({
            code: ERROR_CODES.PUBLISH_CONFLICT,
            details: {
              operation: "publish_site",
              attempts: MAX_SERIALIZATION_ATTEMPTS,
              conflictKind,
            },
            cause: error,
          });
        }

        const delayMs = computePublishRetryDelayMs({
          failedAttempt: attempt,
          jitter: this.jitter,
        });

        log.info("site.publish.transaction.retryScheduled", {
          attempt,
          maxAttempts: MAX_SERIALIZATION_ATTEMPTS,
          conflictKind,
          delayMs,
        });

        await this.sleep(delayMs);
      }
    }

    throw new Error("Unreachable publication transaction state.");
  }
}
