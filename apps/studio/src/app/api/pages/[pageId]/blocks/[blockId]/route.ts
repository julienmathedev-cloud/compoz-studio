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
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { deleteBlock } from "@compoz/core/domain/pages/use-cases/blocks/delete-block";
import { updateSectionBlock } from "@compoz/core/domain/pages/use-cases/blocks/update-section-block";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  DeleteBlockResponse,
  UpdateSectionBlockResponse,
} from "@compoz/infra/http/studio/pages.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteStatusCache } from "@compoz/infra/site";
import {
  adaptDeleteBlockIntent,
  adaptUpdateSectionBlockIntent,
} from "@compoz/studio/app/api/_adapters/pages/blocks/blocks";
import { invalidateUpdatedPageStatus } from "@compoz/studio/app/api/pages/invalidate-page-mutation-status";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import {
  DeleteBlockIntentSchema,
  type DeleteBlockIntentDTO,
  UpdateSectionBlockIntentSchema,
  type UpdateSectionBlockIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";
import { PageIdAndBlockIdParamSchema } from "@compoz/validation/routes/params";

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
        if (
          !body ||
          typeof body !== "object" ||
          !("expectedBlocksRevision" in body)
        ) {
          throw new DomainError({ code: EC.REVISION_REQUIRED });
        }

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

        const pagesRepo = getPagesRepository({ websiteId });
        const statusCache = getSiteStatusCache({ websiteId });

        const runUpdate = updateSectionBlock({
          pages: pagesRepo,
        });

        const adapted = adaptUpdateSectionBlockIntent(dto);

        const result = await runUpdate({
          pageId,
          blockId: paramBlockId,
          ...adapted,
        });

        await invalidateUpdatedPageStatus({
          websiteId,
          outcome: result.outcome,
          statusCache,
          logger,
        });

        const res: UpdateSectionBlockResponse = {
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

        const body = await readJsonOr400(req);
        if (
          !body ||
          typeof body !== "object" ||
          !("expectedBlocksRevision" in body)
        ) {
          throw new DomainError({ code: EC.REVISION_REQUIRED });
        }
        const dto: DeleteBlockIntentDTO = parseDTOOrHttp(
          DeleteBlockIntentSchema,
          body,
          {
            message: EC.VALIDATION_ERROR,
            extras: {
              where: "api.studio.pages.id.blocks.blockId.DELETE.payload",
            },
          },
        );

        const pagesRepo = getPagesRepository({ websiteId });
        const statusCache = getSiteStatusCache({ websiteId });

        const runDelete = deleteBlock({
          pages: pagesRepo,
        });

        const adapted = adaptDeleteBlockIntent(dto);
        const result = await runDelete({
          pageId,
          blockId: paramBlockId,
          ...adapted,
        });

        await invalidateUpdatedPageStatus({
          websiteId,
          outcome: result.outcome,
          statusCache,
          logger,
        });

        const res: DeleteBlockResponse = {
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
