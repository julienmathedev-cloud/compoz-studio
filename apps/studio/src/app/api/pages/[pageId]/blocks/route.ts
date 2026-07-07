/**
 * @file apps/studio/src/app/api/pages/[pageId]/blocks/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for listing and creating section blocks on a page.
 *
 * @remarks
 * - `GET` lists blocks for the requested content state.
 * - `POST` adds a section block to the draft page and invalidates the active Website status cache.
 * - Repositories are scoped by Prisma Website.id.
 */

import "server-only";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import { createSectionBlock } from "@compoz/core/domain/pages/use-cases/blocks/create-section-block";
import { throwHttp } from "@compoz/http/http-error";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  AddSectionBlockResponse,
  ListPageBlocksResponse,
} from "@compoz/infra/http/studio/pages.types";
import { getIdGenerator } from "@compoz/infra/id/index";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteStatusCache } from "@compoz/infra/site";
import { adaptCreateSectionBlockIntent } from "@compoz/studio/app/api/_adapters/pages/blocks/blocks";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import {
  CreateSectionBlockIntentSchema,
  type CreateSectionBlockIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";
import { PageIdParamSchema } from "@compoz/validation/pages/page";

export async function GET(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.pages.id.blocks.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state, websiteId },
      async () => {
        const params = await unwrapParams(ctx.params);

        const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
          message: EC.INVALID_ARGUMENT,
          extras: { where: "api.studio.pages.id.blocks.GET.params" },
        });

        const pagesRepo = getPagesRepository({ websiteId });
        const page = await pagesRepo.readById(state, pageId);

        if (!page) {
          throwHttp(404, {
            code: EC.PAGE_NOT_FOUND,
            message: EC.PAGE_NOT_FOUND,
          });
        }

        const res: ListPageBlocksResponse = {
          blocks: page.blocks ?? [],
        };

        return res;
      },
    );
  });
}

export async function POST(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.pages.id.blocks.POST" as const;

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
          extras: { where: "api.studio.pages.id.blocks.POST.params" },
        });

        const body = await readJsonOr400(req);

        const dto: CreateSectionBlockIntentDTO = parseDTOOrHttp(
          CreateSectionBlockIntentSchema,
          body,
          {
            message: EC.VALIDATION_ERROR,
            extras: { where: "api.studio.pages.id.blocks.POST.payload" },
          },
        );

        const pagesRepo = getPagesRepository({ websiteId });
        const statusCache = getSiteStatusCache({ websiteId });
        const idGenerator = getIdGenerator();

        const runCreate = createSectionBlock({
          pages: pagesRepo,
          idGenerator,
        });

        const patch = adaptCreateSectionBlockIntent(dto);

        const { page } = await runCreate({
          pageId,
          ...patch,
        });

        /**
         * Invalidates the active Website status cache.
         *
         * The cache may still be backed by KV in infra, but its business scope is
         * the Prisma Website.id.
         */
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

        const res: AddSectionBlockResponse = {
          page: page as PageDTO,
        };

        return res;
      },
    );
  });
}
