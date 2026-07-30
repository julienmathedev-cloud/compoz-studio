/**
 * @file apps/studio/src/app/api/pages/[pageId]/blocks/reorder/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for reordering section blocks on a draft page.
 *
 * @remarks
 * - Validates the `pageId` route param and payload before running the domain use case.
 * - Invalidates the active Website status cache after mutations.
 * - Repositories are scoped by Prisma Website.id.
 */

import "server-only";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { reorderBlocks } from "@compoz/core/domain/pages/use-cases/blocks/reorder-blocks";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type { ReorderBlocksResponse } from "@compoz/infra/http/studio/pages.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteStatusCache } from "@compoz/infra/site";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import {
  ReorderBlocksIntentSchema,
  type ReorderBlocksIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";
import { PageIdParamSchema } from "@compoz/validation/pages/page";

export async function POST(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.pages.id.blocks.reorder.POST" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "POST", state: DEFAULT_CONTENT_STATE, websiteId },
      async () => {
        const logger = log.child({ ns: NS });

        const params = await unwrapParams(ctx.params);

        const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
          message: EC.INVALID_ARGUMENT,
          extras: {
            where: "api.studio.pages.id.blocks.reorder.POST.params",
          },
        });

        const body = await readJsonOr400(req);
        if (
          !body ||
          typeof body !== "object" ||
          !("expectedBlocksRevision" in body)
        ) {
          throw new DomainError({ code: EC.REVISION_REQUIRED });
        }

        const dto: ReorderBlocksIntentDTO = parseDTOOrHttp(
          ReorderBlocksIntentSchema,
          body,
          {
            message: EC.VALIDATION_ERROR,
            extras: {
              where: "api.studio.pages.id.blocks.reorder.POST.payload",
            },
          },
        );

        const pagesRepo = getPagesRepository({ websiteId });
        const statusCache = getSiteStatusCache({ websiteId });

        const run = reorderBlocks({
          pages: pagesRepo,
        });

        const result = await run({
          pageId,
          expectedBlocksRevision: dto.expectedBlocksRevision,
          baselineOrder: dto.baselineOrder,
          localOrder: dto.localOrder,
        });

        /**
         * Invalidates the active Website status cache.
         *
         * The cache may still be backed by KV in infra, but its business scope is
         * the Prisma Website.id.
         */
        if (result.outcome === "updated") try {
          logger.debug?.("route.statusCache.invalidate.start", {
            websiteId,
            invalidateStatus: true,
            invalidateStatusDetails: true,
          });

          await Promise.all([
            statusCache.invalidateStatus(),
            statusCache.invalidateStatusDetails(),
          ]);

          logger.debug?.("route.statusCache.invalidate.done", {
            websiteId,
            invalidateStatus: true,
            invalidateStatusDetails: true,
          });
        } catch (error) {
          logger.error?.("route.statusCache.invalidate.failed", {
            websiteId,
            err: String(error),
            invalidateStatus: true,
            invalidateStatusDetails: true,
          });
        }

        const res: ReorderBlocksResponse = {
          outcome: result.outcome,
          blocks: result.blocks,
          blocksRevision: result.blocksRevision,
          affectedBlockId: result.affectedBlockId,
        };

        return res;
      },
    );
  });
}
