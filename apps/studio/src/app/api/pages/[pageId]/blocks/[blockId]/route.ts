/**
 * @file apps/studio/src/app/api/pages/[pageId]/blocks/[blockId]/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for updating or deleting a section block on a draft page.
 *
 * @remarks
 * - Validates route params and payloads before running domain use cases.
 * - Invalidates the active Website status cache after mutations.
 * - Repositories are scoped by Prisma Website.id.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import { deleteBlock } from "@compoz/core/domain/pages/use-cases/blocks/delete-block";
import { updateSectionBlock } from "@compoz/core/domain/pages/use-cases/blocks/update-section-block";
import { throwHttp } from "@compoz/http/http-error";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  DeleteBlockResponse,
  UpdateSectionBlockResponse,
} from "@compoz/infra/http/studio/pages.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteStatusCache } from "@compoz/infra/site";
import { adaptUpdateSectionBlockIntent } from "@compoz/studio/app/api/_adapters/pages/blocks/blocks";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import {
  UpdateSectionBlockIntentSchema,
  type UpdateSectionBlockIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";
import { PageIdAndBlockIdParamSchema } from "@compoz/validation/routes/params";

async function invalidateWebsiteStatusCache(params: {
  websiteId: string;
  statusCache: ReturnType<typeof getSiteStatusCache>;
  logger: ReturnType<typeof log.child>;
}) {
  const { websiteId, statusCache, logger } = params;

  try {
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
}

export async function PATCH(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.pages.id.blocks.blockId.PATCH" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "PATCH", state, websiteId },
      async () => {
        const logger = log.child({ ns: NS });

        const params = await unwrapParams(ctx.params);

        const { pageId, blockId: paramBlockId } = parseDTOOrHttp(
          PageIdAndBlockIdParamSchema,
          params,
          {
            message: EC.INVALID_ARGUMENT,
            extras: {
              where: "api.studio.pages.id.blocks.blockId.PATCH.params",
            },
          },
        );

        const body = await readJsonOr400(req);

        const dto: UpdateSectionBlockIntentDTO = parseDTOOrHttp(
          UpdateSectionBlockIntentSchema,
          body,
          {
            message: EC.VALIDATION_ERROR,
            extras: {
              where: "api.studio.pages.id.blocks.blockId.PATCH.payload",
            },
          },
        );

        if ("blockId" in dto && dto.blockId !== paramBlockId) {
          throwHttp(400, {
            code: EC.INVALID_ARGUMENT,
            message: EC.BLOCK_ID_MISMATCH,
            details: {
              path: ["blockId"],
              meta: { paramBlockId, bodyBlockId: dto.blockId },
            },
          });
        }

        const pagesRepo = getPagesRepository({ websiteId });
        const statusCache = getSiteStatusCache({ websiteId });

        const runUpdate = updateSectionBlock({
          pages: pagesRepo,
        });

        const adapted = adaptUpdateSectionBlockIntent(dto);

        const { page } = await runUpdate({
          pageId,
          blockId: paramBlockId,
          patch: adapted.patch,
        });

        await invalidateWebsiteStatusCache({
          websiteId,
          statusCache,
          logger,
        });

        const res: UpdateSectionBlockResponse = {
          page: page as PageDTO,
        };

        return res;
      },
    );
  });
}

export async function DELETE(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.pages.id.blocks.blockId.DELETE" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "DELETE", state, websiteId },
      async () => {
        const logger = log.child({ ns: NS });

        const params = await unwrapParams(ctx.params);

        const { pageId, blockId: paramBlockId } = parseDTOOrHttp(
          PageIdAndBlockIdParamSchema,
          params,
          {
            message: EC.INVALID_ARGUMENT,
            extras: {
              where: "api.studio.pages.id.blocks.blockId.DELETE.params",
            },
          },
        );

        const pagesRepo = getPagesRepository({ websiteId });
        const statusCache = getSiteStatusCache({ websiteId });

        const runDelete = deleteBlock({
          pages: pagesRepo,
        });

        const { page } = await runDelete({
          pageId,
          blockId: paramBlockId,
        });

        await invalidateWebsiteStatusCache({
          websiteId,
          statusCache,
          logger,
        });

        const res: DeleteBlockResponse = {
          page: page as PageDTO,
        };

        return res;
      },
    );
  });
}
